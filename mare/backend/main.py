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
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        user_id = body.userId if body.userId else 1 # Default to 1 if no auth

        # Ensure agent exists
        cursor.execute("SELECT id FROM agents WHERE name = %s AND user_id = %s", (body.agentName, user_id))
        agent_row = cursor.fetchone()
        if not agent_row:
            cursor.execute("INSERT INTO agents (user_id, name) VALUES (%s, %s)", (user_id, body.agentName))
            agent_id = cursor.lastrowid
        else:
            agent_id = agent_row[0]

        # Ensure session exists (we can create a new session per log for simplicity, or look up recent)
        cursor.execute("INSERT INTO chat_sessions (user_id, agent_id, title) VALUES (%s, %s, %s)", 
                       (user_id, agent_id, body.userQuery[:50]))
        session_id = cursor.lastrowid

        # Insert User Message
        cursor.execute("INSERT INTO chat_messages (session_id, sender_type, content) VALUES (%s, 'user', %s)", 
                       (session_id, body.userQuery))
        
        # Insert Agent Message
        cursor.execute("INSERT INTO chat_messages (session_id, sender_type, content) VALUES (%s, 'agent', %s)", 
                       (session_id, body.agentResponse))
                       
        conn.commit()
        cursor.close()
        conn.close()

        return JSONResponse(content={
            "status": "success",
            "message": "Chat logged to database",
            "sessionId": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"DB Error log_chat: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/saved_files")
async def saved_files(body: SavedFilesRequest):
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        user_id = body.userId if body.userId else 1

        cursor.execute("""
            INSERT INTO saved_files (user_id, folder_name, file_name, file_path) 
            VALUES (%s, %s, %s, %s)
        """, (user_id, body.folderName, body.fileName, f"{body.folderName}/{body.fileName}"))
        
        conn.commit()
        cursor.close()
        conn.close()

        return JSONResponse(content={
            "status": "success",
            "message": f"File '{body.fileName}' saved successfully.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"DB Error saved_files: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/workflow")
async def saved_workflow(body: WorkflowRequest):
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        user_id = body.userId if body.userId else 1

        cursor.execute("""
            INSERT INTO workflows (user_id, name, file_name, nodes_count, edges_count) 
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, "Saved Workflow", body.fileName, body.nodesCount, body.edgesCount))
        
        conn.commit()
        cursor.close()
        conn.close()

        return JSONResponse(content={
            "status": "success",
            "message": f"Workflow saved successfully.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"DB Error workflow: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/oquiron")
async def oquiron(body : LogChatRequest):
    return JSONResponse(content={
        "status" : "success",
        "message" : f"Oquiron model configured successfully.",
        "timestamp" : datetime.now(timezone.utc).isoformat(),
        "userquery" : body.userQuery,
        "agentResponse" : body.agentResponse
    })

@app.get("/api/db-test")
async def db_test():
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        cursor.close()
        conn.close()
        return JSONResponse(content={"status": "success", "tables": tables})
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

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
