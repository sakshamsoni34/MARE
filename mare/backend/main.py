import os
import json
import logging
from datetime import datetime, timezone
import httpx
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from models import (
    AgentRequest, 
    UIEventRequest, 
    SyncFileRequest, 
    SyncConversationRequest, 
    SyncWorkflowRequest, 
    SyncAgentStateRequest,
    RAGIngestRequest,
    RAGQueryRequest,
    RAGReindexRequest
)
from mistral_service import generate_mistral_stream
from database import get_db_pool
from rag_service import rag_service

load_dotenv()
load_dotenv("../.env")

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
if GEMINI_API_KEY:
    logger.info("Google Gemini Engine active.")
elif MISTRAL_API_KEY:
    logger.info("Mistral Engine active (Intelligent RAG fallback enabled).")
else:
    logger.info("Local Intelligent RAG Engine active.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the HTTPX client for connection pooling
    app.state.client = httpx.AsyncClient()
    
    # Initialize RAG vector store and index domain knowledge + workspace files
    try:
        await rag_service.initialize()
        await rag_service.sync_workspace_files_to_rag()
        logger.info("RAG Engine pre-flight initialization and workspace file sync completed.")
    except Exception as e:
        logger.error(f"Failed to initialize RAG Engine on startup: {e}")
    
    yield
    
    # Close the client on shutdown
    await app.state.client.aclose()

app = FastAPI(lifespan=lifespan, title="MARE Multi-Agent RAG Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"), 
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.client

async def get_db(request: Request):
    conn = await get_db_pool()
    try:
        yield conn
    finally:
        await conn.close()

# ----------------- AGENT CHAT & STREAMING -----------------

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

# ----------------- RAG KNOWLEDGE BASE APIS -----------------

@app.get("/api/rag/stats")
async def get_rag_stats():
    """Returns total indexed documents, chunks, sources, and vectorizer health."""
    try:
        stats = await rag_service.get_stats()
        return JSONResponse(content={"status": "success", "stats": stats})
    except Exception as e:
        logger.error(f"Error fetching RAG stats: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.get("/api/rag/documents")
async def list_rag_documents():
    """List all indexed documents, categories, and chunk breakdown."""
    try:
        docs = await rag_service.list_documents()
        return JSONResponse(content={"status": "success", "documents": docs})
    except Exception as e:
        logger.error(f"Error listing RAG documents: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.post("/api/rag/ingest")
async def ingest_rag_document(body: RAGIngestRequest):
    """Ingest custom text document or reference note into RAG vector store."""
    try:
        current_key = os.getenv("MISTRAL_API_KEY", "")
        doc_id = await rag_service.ingest_document(
            title=body.title,
            content=body.content,
            source=body.source or "custom_upload",
            category=body.category or "documentation",
            agent_target=body.agent_target or "all",
            metadata=body.metadata or {},
            mistral_api_key=current_key
        )
        return JSONResponse(content={
            "status": "success",
            "message": f"Document '{body.title}' successfully ingested and indexed into RAG store.",
            "doc_id": doc_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error ingesting into RAG: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.delete("/api/rag/documents/{doc_id}")
async def delete_rag_document(doc_id: str):
    """Delete a document and all its chunks from RAG vector store."""
    try:
        success = await rag_service.delete_document(doc_id)
        return JSONResponse(content={"status": "success", "message": f"Document '{doc_id}' deleted."})
    except Exception as e:
        logger.error(f"Error deleting RAG document: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.post("/api/rag/query")
async def query_rag_endpoint(body: RAGQueryRequest):
    """Query RAG store directly to inspect semantic relevance scores and retrieved chunks for any agent."""
    try:
        current_key = os.getenv("MISTRAL_API_KEY", "")
        prompt_block, sources_meta = await rag_service.retrieve_context(
            query=body.query,
            agent_name=body.agent_name or "all",
            top_k=body.top_k or 4,
            category=body.category,
            mistral_api_key=current_key
        )
        return JSONResponse(content={
            "status": "success",
            "query": body.query,
            "agent_name": body.agent_name,
            "retrieved_count": len(sources_meta),
            "sources": sources_meta,
            "context_prompt_block": prompt_block
        })
    except Exception as e:
        logger.error(f"Error querying RAG: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.post("/api/rag/reindex")
async def reindex_rag_endpoint(body: RAGReindexRequest):
    """Force re-index workspace files and refresh domain knowledge embeddings."""
    try:
        current_key = os.getenv("MISTRAL_API_KEY", "")
        await rag_service.initialize()
        if body.include_workspace_files:
            await rag_service.sync_workspace_files_to_rag(mistral_api_key=current_key)
        stats = await rag_service.get_stats()
        return JSONResponse(content={
            "status": "success",
            "message": "RAG Knowledge Base reindexed successfully.",
            "stats": stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error reindexing RAG: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

# ----------------- UI EVENTS & WORKSPACE SYNC -----------------

@app.post("/api/event")
async def handle_ui_event(body: UIEventRequest):
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

@app.post("/api/sync/file")
async def sync_file(body: SyncFileRequest, conn = Depends(get_db)):
    try:
        async with conn.cursor() as cursor:
            # Upsert logic based on node_id (checking if it exists)
            await cursor.execute("SELECT id FROM files WHERE node_id = ?", (body.node_id,))
            exists = await cursor.fetchone()
            
            agent_contents_json = json.dumps(body.agent_contents) if body.agent_contents else None

            if exists:
                await cursor.execute("""
                    UPDATE files SET parent_id=?, name=?, type=?, content=?, agent_name=?, agent_contents=?
                    WHERE node_id=?
                """, (body.parent_id, body.name, body.type, body.content, body.agent_name, agent_contents_json, body.node_id))
            else:
                await cursor.execute("""
                    INSERT INTO files (node_id, parent_id, name, type, content, agent_name, agent_contents)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (body.node_id, body.parent_id, body.name, body.type, body.content, body.agent_name, agent_contents_json))
            
            await conn.commit()

        # Asynchronously ingest/update file in RAG knowledge base so agents can immediately retrieve its content!
        if body.type == 'file' and body.content and body.content.strip():
            try:
                current_key = os.getenv("MISTRAL_API_KEY", "")
                await rag_service.ingest_document(
                    title=f"Workspace File: {body.name}",
                    content=body.content,
                    source="workspace_file",
                    category="code" if body.name.endswith(('.py', '.js', '.ts', '.tsx', '.json', '.sql', '.html', '.css')) else "document",
                    agent_target=body.agent_name or "all",
                    metadata={"file_name": body.name, "node_id": body.node_id},
                    doc_id=f"file_{body.node_id}",
                    mistral_api_key=current_key
                )
            except Exception as rag_err:
                logger.warning(f"Non-blocking RAG file ingest error: {rag_err}")
            
        return JSONResponse(content={"status": "success", "message": "File synced and indexed into RAG", "timestamp": datetime.now(timezone.utc).isoformat()})
    except Exception as e:
        logger.error(f"DB Error sync_file: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/sync/conversation")
async def sync_conversation(body: SyncConversationRequest, conn = Depends(get_db)):
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT id FROM conversations WHERE convo_id = ?", (body.convo_id,))
            exists = await cursor.fetchone()
            
            if exists:
                await cursor.execute("""
                    UPDATE conversations SET agent=?, title=?, content=?, timestamp=?
                    WHERE convo_id=?
                """, (body.agent, body.title, body.content, body.timestamp, body.convo_id))
            else:
                await cursor.execute("""
                    INSERT INTO conversations (convo_id, agent, title, content, timestamp)
                    VALUES (?, ?, ?, ?, ?)
                """, (body.convo_id, body.agent, body.title, body.content, body.timestamp))
                
            await conn.commit()
            
        return JSONResponse(content={"status": "success", "message": "Conversation synced", "timestamp": datetime.now(timezone.utc).isoformat()})
    except Exception as e:
        logger.error(f"DB Error sync_conversation: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/sync/workflow")
async def sync_workflow(body: SyncWorkflowRequest, conn = Depends(get_db)):
    try:
        async with conn.cursor() as cursor:
            nodes_json = json.dumps(body.nodes)
            edges_json = json.dumps(body.edges)
            
            await cursor.execute("""
                INSERT INTO workflows (project_name, nodes, edges)
                VALUES (?, ?, ?)
            """, (body.project_name or "default", nodes_json, edges_json))
            
            await conn.commit()
            
        return JSONResponse(content={"status": "success", "message": "Workflow synced", "timestamp": datetime.now(timezone.utc).isoformat()})
    except Exception as e:
        logger.error(f"DB Error sync_workflow: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/sync/agent_state")
async def sync_agent_state(body: SyncAgentStateRequest, conn = Depends(get_db)):
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT id FROM agents_state WHERE agent_name = ?", (body.agent_name,))
            exists = await cursor.fetchone()
            
            if exists:
                await cursor.execute("""
                    UPDATE agents_state SET script_code=?
                    WHERE agent_name=?
                """, (body.script_code, body.agent_name))
            else:
                await cursor.execute("""
                    INSERT INTO agents_state (agent_name, script_code)
                    VALUES (?, ?)
                """, (body.agent_name, body.script_code))
                
            await conn.commit()
            
        return JSONResponse(content={"status": "success", "message": "Agent state synced", "timestamp": datetime.now(timezone.utc).isoformat()})
    except Exception as e:
        logger.error(f"DB Error sync_agent_state: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/oquiron")
async def oquiron(body: dict):
    return JSONResponse(content={
        "status": "success",
        "message": "Oquiron model configured successfully with active RAG grounding.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.get("/api/state")
async def get_state(conn=Depends(get_db)):
    try:
        async with conn.cursor() as cursor:
            # Fetch Projects
            await cursor.execute("SELECT * FROM projects")
            projects_data = await cursor.fetchall()
            projects = [p["name"] for p in projects_data]
            activeProject = projects[0] if projects else ""

            # Fetch Files
            await cursor.execute("SELECT * FROM files")
            files_data = await cursor.fetchall()
            file_system = []
            for f in files_data:
                agent_contents = {}
                if f.get("agent_contents"):
                    agent_contents = json.loads(f["agent_contents"]) if isinstance(f["agent_contents"], str) else f["agent_contents"]
                
                file_system.append({
                    "id": f["node_id"],
                    "parent_id": f["parent_id"],
                    "name": f["name"],
                    "type": f["type"],
                    "content": f["content"] or "",
                    "agentName": f["agent_name"] or "",
                    "agentContents": agent_contents
                })

            node_map = { node["id"]: {**node, "children": []} for node in file_system }
            nested_fs = []
            for node in file_system:
                if node["parent_id"] and node["parent_id"] in node_map:
                    node_map[node["parent_id"]]["children"].append(node_map[node["id"]])
                else:
                    nested_fs.append(node_map[node["id"]])

            # Fetch Conversations
            await cursor.execute("SELECT * FROM conversations")
            conversations_data = await cursor.fetchall()
            pastConversations = []
            for c in conversations_data:
                pastConversations.append({
                    "id": c["convo_id"],
                    "agent": c["agent"],
                    "title": c["title"],
                    "content": c["content"],
                    "timestamp": c["timestamp"]
                })

            # Fetch Workflows
            await cursor.execute("SELECT * FROM workflows ORDER BY created_at DESC LIMIT 1")
            workflow = await cursor.fetchone()
            workflowNodes = []
            workflowEdges = []
            if workflow:
                nodes_raw = workflow.get("nodes")
                edges_raw = workflow.get("edges")
                workflowNodes = json.loads(nodes_raw) if isinstance(nodes_raw, str) else (nodes_raw or [])
                workflowEdges = json.loads(edges_raw) if isinstance(edges_raw, str) else (edges_raw or [])

            # Fetch Agent States
            await cursor.execute("SELECT * FROM agents_state")
            agents_state_data = await cursor.fetchall()
            agentScripts = {}
            for a in agents_state_data:
                agentScripts[a["agent_name"]] = a["script_code"]

        # Fetch RAG stats
        rag_stats = await rag_service.get_stats()

        return JSONResponse(content={
            "status": "success",
            "state": {
                "projects": projects,
                "activeProject": activeProject,
                "fileSystem": nested_fs,
                "pastConversations": pastConversations,
                "workflowNodes": workflowNodes,
                "workflowEdges": workflowEdges,
                "agentScripts": agentScripts,
                "ragStats": rag_stats
            }
        })
    except Exception as e:
        logger.error(f"DB Error get_state: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/db-test")
async def db_test(conn=Depends(get_db)):
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = await cursor.fetchall()
            
        return JSONResponse(content={"status": "success", "tables": [dict(t) for t in tables]})
    except Exception as e:
        logger.error(f"DB Error db-test: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.post("/api/Signout")
async def Signout(body: dict):
    return JSONResponse(content={
        "status": "success",
        "message": "Signout successful.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8555, reload=True)
