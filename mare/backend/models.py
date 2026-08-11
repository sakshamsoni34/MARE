from pydantic import BaseModel, Field
from typing import Optional

class AgentRequest(BaseModel):
    agentName: str
    systemPrompt: Optional[str] = None
    userQuery: str

class UIEventRequest(BaseModel):
    action: str = "unknown"
    details: Optional[str] = ""
    folderName: Optional[str] = "unknown"

class LogChatRequest(BaseModel):
    agentName: str = "unknown"
    userQuery: str = ""
    agentResponse: str = ""

class SavedFilesRequest(BaseModel):
    fileName: str = "unknown"
    agentName: str = "unknown"
    folderName: Optional[str] = "unknown"

class WorkflowRequest(BaseModel):
    fileName: str = "unknown"
    nodesCount: int = 0
    edgesCount: int = 0
