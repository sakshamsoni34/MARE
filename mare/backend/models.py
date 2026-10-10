from pydantic import BaseModel
from typing import Optional, Any, Dict, List

class AgentRequest(BaseModel):
    agentName: str
    systemPrompt: Optional[str] = None
    userQuery: str

class UIEventRequest(BaseModel):
    action: str = "unknown"
    details: Optional[str] = ""
    folderName: Optional[str] = "unknown"

class SyncFileRequest(BaseModel):
    node_id: str
    parent_id: Optional[str] = None
    name: str
    type: str # 'file' or 'folder'
    content: Optional[str] = None
    agent_name: Optional[str] = None
    agent_contents: Optional[Dict[str, str]] = None

class SyncConversationRequest(BaseModel):
    convo_id: str
    agent: str
    title: str
    content: str
    timestamp: str

class SyncWorkflowRequest(BaseModel):
    project_name: Optional[str] = None
    nodes: List[Any]
    edges: List[Any]

class SyncAgentStateRequest(BaseModel):
    agent_name: str
    script_code: str

class RAGIngestRequest(BaseModel):
    title: str
    content: str
    source: Optional[str] = "knowledge_base"
    category: Optional[str] = "documentation"
    agent_target: Optional[str] = "all"
    metadata: Optional[Dict[str, Any]] = None

class RAGQueryRequest(BaseModel):
    query: str
    agent_name: Optional[str] = "all"
    top_k: Optional[int] = 4
    category: Optional[str] = None

class RAGReindexRequest(BaseModel):
    include_workspace_files: Optional[bool] = True


