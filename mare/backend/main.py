import os
import logging
from datetime import datetime, timezone
import httpx
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from models import AgentRequest, UIEventRequest, LogChatRequest, SavedFilesRequest, WorkflowRequest
from mistral_service import generate_mistral_stream

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
if not MISTRAL_API_KEY:
    logger.warning("MISTRAL_API_KEY is missing in your .env file. The agent will not be able to connect to the Mistral API.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the HTTPX client for connection pooling
    app.state.client = httpx.AsyncClient()
    yield
    # Close the client on shutdown
    await app.state.client.aclose()

app = FastAPI(lifespan=lifespan, title="MARE API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.client

@app.post("/api/agent")
async def handle_agent_request(body: AgentRequest, client: httpx.AsyncClient = Depends(get_client)):
    current_key = os.getenv("MISTRAL_API_KEY", "")
    return StreamingResponse(
        generate_mistral_stream(
            client=client, 
            agent_name=body.agentName, 
            system_prompt_from_ui=body.systemPrompt or "", 
            user_query=body.userQuery, 
            mistral_api_key=current_key
        ),
        media_type="text/event-stream"
    )

@app.post("/api/event")
async def handle_ui_event(body: UIEventRequest):
    # Specific format for "Open Folder"
    if body.action == "Open Folder":
        return JSONResponse(content={
            "folder": body.folderName,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    return JSONResponse(content={
        "action": body.action,
        "details": body.details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.post("/api/log_chat")
async def log_chat(body: LogChatRequest):
    return JSONResponse(content={
        "agentName": body.agentName,
        "userQuery": body.userQuery,
        "agentResponse": body.agentResponse,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.post("/api/saved_files")
async def saved_files(body: SavedFilesRequest):
    return JSONResponse(content={
        "status": "success",
        "message": f"File '{body.fileName}' saved successfully.",
        "fileName": body.fileName,
        "folderName": body.folderName,
        "agentName": body.agentName,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.post("/api/workflow")
async def saved_workflow(body: WorkflowRequest):
    return JSONResponse(content={
        "status": "success",
        "message": f"Workflow configuration '{body.fileName}' saved successfully.",
        "fileName": body.fileName,
        "nodesCount": body.nodesCount,
        "edgesCount": body.edgesCount,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.post("/api/oquiron")
async def oquiron(body : LogChatRequest):
    return JSONResponse(content={
        "status" : "success",
        "message" : f"Oquiron model configured successfully.",
        "timestamp" : datetime.now(timezone.utc).isoformat(),
        "userquery" : body.userQuery,
        "agentResponse" : body.agentResponse
    })

@app.post("api/Signout")
async def Signout(body : LogChatRequest):
    return JSONResponse(content={
        "status" : "success",
        "message" : f"Signout successful.",
        "timestamp" : datetime.now(timezone.utc).isoformat(),
        "userquery" : body.userQuery,
        "agentResponse" : body.agentResponse
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8555, reload=True)
