import os
import sqlite3
import logging
from contextlib import contextmanager

logger = logging.getLogger("mare.database")

DB_PATH = os.path.join(os.path.dirname(__file__), "mare.db")

def get_connection():
    """Create and return a configured sqlite3 connection with WAL mode enabled."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 5000")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Synchronously create all required tables and indices."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT DEFAULT 'developer',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        user_email TEXT DEFAULT 'developer@mare.ai',
        description TEXT,
        goal TEXT,
        source TEXT,
        priority TEXT DEFAULT 'high',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN user_email TEXT DEFAULT 'developer@mare.ai'")
    except sqlite3.OperationalError:
        pass
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_user ON projects (user_email)")

    # 3. Files table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id TEXT UNIQUE NOT NULL,
        parent_id TEXT,
        project_name TEXT DEFAULT 'default',
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('file', 'folder')) NOT NULL,
        content TEXT,
        agent_name TEXT,
        agent_contents TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_node_id ON files (node_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_project ON files (project_name)")

    # 4. Conversations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        convo_id TEXT UNIQUE NOT NULL,
        project_name TEXT DEFAULT 'default',
        agent TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        timestamp TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_convo_id ON conversations (convo_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations (project_name)")

    # 5. Workflows table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT UNIQUE NOT NULL,
        nodes TEXT,
        edges TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_workflows_project ON workflows (project_name)")

    # 6. Agents state table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agents_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL,
        project_name TEXT DEFAULT 'default',
        script_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(agent_name, project_name)
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_agents_state_name ON agents_state (agent_name)")

    # 7. Audit logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        threat_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        details TEXT,
        client_ip TEXT,
        blocked INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()
    logger.info(f"Database schema initialized successfully at {DB_PATH}")

def get_db():
    """FastAPI dependency for SQLite database session."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
