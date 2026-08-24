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

