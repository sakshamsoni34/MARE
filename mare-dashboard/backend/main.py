import os
import json
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the HTTPX client for connection pooling
    app.state.client = httpx.AsyncClient()
    yield
    # Close the client on shutdown
    await app.state.client.aclose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from agent_prompts import AGENT_PROMPTS

from datetime import datetime

def get_base_prompt(agent_name: str) -> str:
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    base_prompt = AGENT_PROMPTS.get(agent_name, 'You are a helpful AI assistant in the MARE multi-agent system.')
    recency_injection = f"\n\n[SYSTEM INFO]\nThe current date and time is {current_time}. You must provide the most modern, up-to-date information available. Avoid outdated practices or old news."
    return base_prompt + recency_injection

workflow_instruction = '''
If the user asks for a workflow or diagram, you must provide it using a JSON block formatted exactly like this:
```json
{
  "workflow": {
    "nodes": [
      { "id": "1", "position": { "x": 100, "y": 100 }, "data": { "label": "Node 1" }, "type": "default" }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "animated": true }
    ]
  }
}
```
'''

@app.post("/api/agent")
async def handle_agent_request(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    agent_name = body.get("agentName")
    system_prompt_from_ui = body.get("systemPrompt")
    user_query = body.get("userQuery")

    if not user_query:
        raise HTTPException(status_code=400, detail="User query is required")

    base_prompt = get_base_prompt(agent_name)
    editor_context = f"\n\n--- Conversation History & Current Context ---\n{system_prompt_from_ui}" if system_prompt_from_ui else ""
    system_prompt = base_prompt + editor_context + "\n" + workflow_instruction
    
    mistral_payload = {
        "model": "mistral-large-latest",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "stream": True,
    }

    token = os.getenv("MISTRAL_API_KEY", "")
    if not token:
        raise HTTPException(status_code=401, detail="MISTRAL_API_KEY is missing in your .env file.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    async def stream_generator():
        try:
            client = request.app.state.client
            async with client.stream(
                "POST",
                "https://api.mistral.ai/v1/chat/completions",
                headers=headers,
                json=mistral_payload,
                timeout=httpx.Timeout(60.0)
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    yield f"data: {json.dumps({'error': f'Mistral API Error: {response.status_code}', 'details': error_text.decode('utf-8', errors='ignore')})}\n\n".encode('utf-8')
                    return
                
                async for chunk in response.aiter_bytes():
                    yield chunk
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n".encode('utf-8')

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream"
    )

from datetime import datetime, timezone
from fastapi.responses import JSONResponse

@app.post("/api/event")
async def handle_ui_event(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    action = body.get("action", "unknown")
    
    # Specific format for "Open Folder"
    if action == "Open Folder":
        return JSONResponse(content={
            "folder": body.get("folderName", "unknown"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    return JSONResponse(content={
        "action": action,
        "details": body.get("details", ""),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.post("/api/log_chat")
async def log_chat(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
        
    return JSONResponse(content={
        "agentName": body.get("agentName", "unknown"),
        "userQuery": body.get("userQuery", ""),
        "agentResponse": body.get("agentResponse", ""),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.post("/api/saved_files")
async def saved_files(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
        
    return JSONResponse(content={
        "status": "success",
        "message": f"File '{body.get('fileName', 'unknown')}' saved successfully.",
        "fileName": body.get("fileName", "unknown"),
        "agentName": body.get("agentName", "unknown"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.post("/api/workflow")
async def saved_workflow(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
        
    return JSONResponse(content={
        "status": "success",
        "message": f"Workflow configuration '{body.get('fileName', 'unknown')}' saved successfully.",
        "fileName": body.get("fileName", "unknown"),
        "nodesCount": body.get("nodesCount", 0),
        "edgesCount": body.get("edgesCount", 0),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8555, reload=True)
