import os
import json
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_system_prompt(agent_name: str) -> str:
    prompts = {
        'Researcher Agent': 'You are an expert Researcher Agent. Your sole purpose is to conduct deep research, gather information, and synthesize complex topics into easy-to-understand reports. Only provide factual, researched information.',
        'Coder Agent': 'You are an expert Coder Agent. Your sole purpose is to write clean, efficient, and well-documented code. Focus only on coding and architectural decisions. Provide code blocks when appropriate.',
        'Planner Agent': 'You are an expert Planner Agent. Your role is to break down complex tasks into manageable, actionable steps. Provide clear outlines and roadmaps.',
        'Executor Agent': 'You are an Executor Agent. Your role is to simulate the execution of tasks and provide step-by-step logs of what would happen during execution.',
        'Reviewer Agent': 'You are an expert Reviewer Agent. Your role is to critically analyze code or text, identify flaws, suggest improvements, and ensure high quality.',
        'Designer Agent': 'You are a Designer Agent. Your role is to suggest UI/UX improvements, color palettes, layouts, and overall design systems.',
        'Tester Agent': 'You are a Tester Agent. Your role is to write unit tests, integration tests, and QA plans to ensure the system works perfectly.',
    }
    return prompts.get(agent_name, 'You are a helpful AI assistant in the MARE multi-agent system.')


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

    system_prompt = system_prompt_from_ui if system_prompt_from_ui else get_system_prompt(agent_name)
    
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
        async with httpx.AsyncClient() as client:
            try:
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8555, reload=True)
