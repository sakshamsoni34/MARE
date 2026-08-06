import uuid
import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, BigInteger, JSON, Enum
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255))
    first_name = Column(String(100))
    last_name = Column(String(100))
    avatar_url = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login_at = Column(DateTime)
    
    organizations = relationship("OrganizationMember", back_populates="user")
    projects = relationship("Project", back_populates="creator")

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    billing_plan = Column(String(50), default="free")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    deleted_at = Column(DateTime)
    
    members = relationship("OrganizationMember", back_populates="organization")
    projects = relationship("Project", back_populates="organization")

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum("owner", "admin", "member", "viewer", name="org_role_enum"), default="member")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="organizations")

class Project(Base):
    __tablename__ = "projects"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    goal = Column(Text)
    data_source = Column(String(255))
    priority = Column(String(50))
    settings = Column(JSON, default=dict)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    deleted_at = Column(DateTime)
    
    organization = relationship("Organization", back_populates="projects")
    creator = relationship("User", back_populates="projects")
    agent_configs = relationship("AgentConfig", back_populates="project")
    agent_runs = relationship("AgentRun", back_populates="project")
    file_nodes = relationship("FileSystemNode", back_populates="project")
    workflows = relationship("Workflow", back_populates="project")
    system_logs = relationship("SystemLog", back_populates="project")

class AgentType(Base):
    __tablename__ = "agent_types"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    default_prompt = Column(Text)
    capabilities = Column(JSON)

class AgentConfig(Base):
    __tablename__ = "agent_configs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    agent_type_id = Column(Integer, ForeignKey("agent_types.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255))
    system_prompt = Column(Text)
    llm_model = Column(String(100), default="mistral-large-latest")
    temperature = Column(Float, default=0.7)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="agent_configs")
    agent_runs = relationship("AgentRun", back_populates="agent_config")

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    agent_config_id = Column(String(36), ForeignKey("agent_configs.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum("pending", "running", "completed", "failed", "cancelled", name="run_status_enum"), default="pending")
    user_query = Column(Text)
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="agent_runs")
    agent_config = relationship("AgentConfig", back_populates="agent_runs")
    messages = relationship("AgentMessage", back_populates="agent_run")
    system_logs = relationship("SystemLog", back_populates="agent_run")

class AgentMessage(Base):
    __tablename__ = "agent_messages"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_run_id = Column(String(36), ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    agent_run = relationship("AgentRun", back_populates="messages")

class FileSystemNode(Base):
    __tablename__ = "file_system_nodes"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(String(36), ForeignKey("file_system_nodes.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    type = Column(Enum("file", "folder", name="node_type_enum"), nullable=False)
    size_bytes = Column(BigInteger, default=0)
    mime_type = Column(String(100))
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    deleted_at = Column(DateTime)
    
    project = relationship("Project", back_populates="file_nodes")
    parent = relationship("FileSystemNode", remote_side=[id])
    contents = relationship("NodeContent", back_populates="file_node")

class NodeContent(Base):
    __tablename__ = "node_contents"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    file_node_id = Column(String(36), ForeignKey("file_system_nodes.id", ondelete="CASCADE"), nullable=False)
    agent_config_id = Column(String(36), ForeignKey("agent_configs.id", ondelete="SET NULL"))
    content = Column(Text)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    file_node = relationship("FileSystemNode", back_populates="contents")

class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="workflows")
    nodes = relationship("WorkflowNode", back_populates="workflow")
    edges = relationship("WorkflowEdge", back_populates="workflow")

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    ui_node_id = Column(String(100), nullable=False)
    type = Column(String(100), default="default")
    position_x = Column(Float)
    position_y = Column(Float)
    data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    workflow = relationship("Workflow", back_populates="nodes")

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    ui_edge_id = Column(String(100), nullable=False)
    source_node_id = Column(String(100), nullable=False)
    target_node_id = Column(String(100), nullable=False)
    animated = Column(Boolean, default=False)
    data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    workflow = relationship("Workflow", back_populates="edges")

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"))
    agent_run_id = Column(String(36), ForeignKey("agent_runs.id", ondelete="CASCADE"))
    log_level = Column(String(20), default="INFO")
    message = Column(Text, nullable=False)
    metadata_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="system_logs")
    agent_run = relationship("AgentRun", back_populates="system_logs")
