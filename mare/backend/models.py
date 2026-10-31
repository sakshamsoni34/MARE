import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any, Dict, List

# RFC 5322 Compliant Email Regex
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class AgentRequest(BaseModel):
    agentName: str = Field(..., min_length=1, max_length=100)
    systemPrompt: Optional[str] = Field(default=None, max_length=50000)
    userQuery: str = Field(..., min_length=1, max_length=20000)

class UIEventRequest(BaseModel):
    action: str = Field(default="unknown", max_length=100)
    details: Optional[str] = Field(default="", max_length=5000)
    folderName: Optional[str] = Field(default="unknown", max_length=255)

class SyncFileRequest(BaseModel):
    node_id: str = Field(..., min_length=1, max_length=255)
    parent_id: Optional[str] = Field(default=None, max_length=255)
    project_name: Optional[str] = Field(default="default", max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., pattern=r"^(file|folder)$")
    content: Optional[str] = Field(default="", max_length=10_000_000)
    agent_name: Optional[str] = Field(default=None, max_length=100)
    agent_contents: Optional[Dict[str, str]] = None

    @field_validator("name")
    @classmethod
    def validate_node_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean or re.search(r"[\x00/\\:*?\"<>|]|\.\.", clean):
            raise ValueError("File/folder name contains invalid characters or path traversal elements.")
        return clean

class SyncConversationRequest(BaseModel):
    convo_id: str = Field(..., min_length=1, max_length=255)
    project_name: Optional[str] = Field(default="default", max_length=100)
    agent: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., max_length=5_000_000)
    timestamp: str = Field(default="", max_length=100)

class SyncWorkflowRequest(BaseModel):
    project_name: Optional[str] = Field(default="default", max_length=100)
    nodes: List[Any] = Field(default_factory=list)
    edges: List[Any] = Field(default_factory=list)

class SyncAgentStateRequest(BaseModel):
    agent_name: str = Field(..., min_length=1, max_length=100)
    project_name: Optional[str] = Field(default="default", max_length=100)
    script_code: str = Field(default="", max_length=5_000_000)

class ExecuteCodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=100_000)
    language: Optional[str] = Field(default="python", max_length=50)
    timeout: Optional[int] = Field(default=10, ge=1, le=30)

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> str:
        lang = (v or "python").lower().strip()
        if lang != "python":
            raise ValueError("Only 'python' is supported in the secure execution sandbox.")
        return lang

class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default="", max_length=10000)
    goal: Optional[str] = Field(default="", max_length=10000)
    source: Optional[str] = Field(default="user", max_length=50)
    priority: Optional[str] = Field(default="high", max_length=50)

    @field_validator("name")
    @classmethod
    def validate_project_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean or re.search(r"[\x00/\\:*?\"<>|]|\.\.", clean):
            raise ValueError("Project name contains invalid characters or path traversal elements.")
        return clean

class WorkflowExecuteRequest(BaseModel):
    nodes: List[Any] = Field(default_factory=list)
    edges: List[Any] = Field(default_factory=list)
    project_name: Optional[str] = Field(default="default", max_length=100)

class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)
    first_name: Optional[str] = Field(default="", max_length=100)
    last_name: Optional[str] = Field(default="", max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format.")
        return clean

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters.")
        has_letter = any(c.isalpha() for c in v)
        has_number_or_special = any(not c.isalpha() for c in v)
        if not (has_letter and has_number_or_special):
            raise ValueError("Password must contain at least one letter and at least one number or special character.")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def sanitize_name_fields(cls, v: Optional[str]) -> str:
        if not v:
            return ""
        clean = re.sub(r"<[^>]*>", "", v.strip())
        return clean[:100]

class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def clean_login_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format.")
        return clean
