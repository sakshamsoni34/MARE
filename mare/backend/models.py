from pydantic import BaseModel, EmailStr
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
    project_name: Optional[str] = "default"
    name: str
    type: str  # 'file' or 'folder'
    content: Optional[str] = ""
    agent_name: Optional[str] = None
    agent_contents: Optional[Dict[str, str]] = None

class SyncConversationRequest(BaseModel):
    convo_id: str
    project_name: Optional[str] = "default"
    agent: str
    title: str
    content: str
    timestamp: str

class SyncWorkflowRequest(BaseModel):
    project_name: Optional[str] = "default"
    nodes: List[Any] = []
    edges: List[Any] = []

class SyncAgentStateRequest(BaseModel):
    agent_name: str
    project_name: Optional[str] = "default"
    script_code: str

class ExecuteCodeRequest(BaseModel):
    code: str
    language: Optional[str] = "python"
    timeout: Optional[int] = 10

class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    goal: Optional[str] = ""
    source: Optional[str] = "user"
    priority: Optional[str] = "high"

class WorkflowExecuteRequest(BaseModel):
    nodes: List[Any] = []
    edges: List[Any] = []
    project_name: Optional[str] = "default"

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""

class UserLoginRequest(BaseModel):
    email: str
    password: str
