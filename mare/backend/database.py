import os
import re
import sqlite3
import logging
from typing import Any, List, Optional, Union
from dotenv import load_dotenv

# Load configuration from mare/backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger("mare.database")

DB_TYPE = os.getenv("DB_TYPE", "mysql").lower()
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Saksham@2006")
DB_NAME = os.getenv("DB_NAME", "mare")
DB_PATH = os.path.join(os.path.dirname(__file__), "mare.db")

# Conditional PyMySQL import
try:
    import pymysql
    import pymysql.cursors
    HAS_PYMYSQL = True
except ImportError:
    HAS_PYMYSQL = False
    logger.warning("PyMySQL is not installed. Database will use SQLite fallback.")


# =====================================================================
# 1. MYSQL QUERY & ROW COMPATIBILITY LAYER
# =====================================================================

class MySQLRow(dict):
    """
    Subclasses dict to enable dual access mode:
    - Dict key access: row["email"], row["id"]
    - Tuple index access: row[0], row[1]
    Identical behavior to sqlite3.Row for zero-friction FastAPI route compatibility.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._values = list(self.values())

    def __getitem__(self, item):
        if isinstance(item, int):
            return self._values[item]
        return super().__getitem__(item)


def translate_query(query: str) -> str:
    """
    Translates SQLite-dialect queries into standard MySQL 8.x:
    1. Replaces 'sqlite_master WHERE type=\'table\'' with information_schema lookup.
    2. Replaces PRAGMA commands with SELECT 1 no-ops.
    3. Translates SQLite 'ON CONFLICT(...) DO UPDATE SET' into 'ON DUPLICATE KEY UPDATE'.
    4. Translates 'excluded.col' into MySQL's 'VALUES(col)'.
    5. Replaces '?' parameter markers with '%s' markers safely outside of quoted literals.
    """
    q = query.strip()
    
    # 1. Table discovery query
    if re.search(r"sqlite_master\s+WHERE\s+type\s*=\s*['\"]table['\"]", q, re.I):
        return "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()"
    
    # 2. SQLite PRAGMA commands
    if q.upper().startswith("PRAGMA"):
        return "SELECT 1"

    # 3. UPSERT conflict resolution translation
    q = re.sub(r"ON\s+CONFLICT\s*\([^)]*\)\s*DO\s+UPDATE\s+SET", "ON DUPLICATE KEY UPDATE", q, flags=re.IGNORECASE)
    q = re.sub(r"excluded\.(\w+)", r"VALUES(\1)", q, flags=re.IGNORECASE)

    # 4. Safe placeholder replacement: replace '?' with '%s' outside quotes
    out = []
    in_quote = False
    quote_char = ""
    for char in q:
        if char in ("'", '"', '`') and not in_quote:
            in_quote = True
            quote_char = char
            out.append(char)
        elif char == quote_char and in_quote:
            in_quote = False
            quote_char = ""
            out.append(char)
        elif char == "?" and not in_quote:
            out.append("%s")
        else:
            out.append(char)
    return "".join(out)


class MySQLCursorWrapper:
    """Wraps PyMySQL DictCursor to mirror standard Python DB-API / sqlite3.Cursor."""
    def __init__(self, raw_cursor):
        self._cursor = raw_cursor

    def execute(self, query: str, params: Any = None):
        translated = translate_query(query)
        if params is not None:
            if isinstance(params, (list, tuple)):
                return self._cursor.execute(translated, tuple(params))
            return self._cursor.execute(translated, params)
        return self._cursor.execute(translated)

    def executemany(self, query: str, seq_of_params: Any):
        translated = translate_query(query)
        return self._cursor.executemany(translated, seq_of_params)

    def fetchone(self) -> Optional[MySQLRow]:
        row = self._cursor.fetchone()
        return MySQLRow(row) if row is not None else None

    def fetchall(self) -> List[MySQLRow]:
        rows = self._cursor.fetchall()
        return [MySQLRow(r) for r in rows]

    def fetchmany(self, size: Optional[int] = None) -> List[MySQLRow]:
        rows = self._cursor.fetchmany(size) if size else self._cursor.fetchmany()
        return [MySQLRow(r) for r in rows]

    @property
    def lastrowid(self):
        return self._cursor.lastrowid

    @property
    def rowcount(self):
        return self._cursor.rowcount

    @property
    def description(self):
        return self._cursor.description

    def close(self):
        try:
            return self._cursor.close()
        except Exception:
            pass

    def __iter__(self):
        for row in self._cursor:
            yield MySQLRow(row)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class MySQLConnectionWrapper:
    """Wraps PyMySQL Connection to provide cursor, direct execute, and transaction contexts."""
    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self):
        return MySQLCursorWrapper(self._conn.cursor())

    def execute(self, query: str, params: Any = None):
        cur = self.cursor()
        cur.execute(query, params)
        return cur

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        try:
            return self._conn.close()
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        self.close()


# =====================================================================
# 2. CONNECTION FACTORY
# =====================================================================

def _get_sqlite_connection():
    """Create and return a configured sqlite3 connection with WAL mode enabled."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 5000")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def get_connection():
    """
    Return an active database connection.
    If DB_TYPE is 'mysql', connects to MySQL on localhost:3306.
    If MySQL connection is not configured or unavailable, seamlessly falls back to SQLite.
    """
    if DB_TYPE == "mysql" and HAS_PYMYSQL:
        try:
            raw = pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                autocommit=True,
                charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor
            )
            return MySQLConnectionWrapper(raw)
        except Exception as e:
            logger.warning(f"Unable to connect to MySQL database '{DB_NAME}' ({e}). Falling back to SQLite.")
            return _get_sqlite_connection()
    return _get_sqlite_connection()


# =====================================================================
# 3. SCHEMA INITIALIZATION
# =====================================================================

def init_db():
    """Synchronously create all required tables and indices for MySQL or SQLite."""
    conn = get_connection()
    cursor = conn.cursor()

    is_mysql = isinstance(conn, MySQLConnectionWrapper)

    if is_mysql:
        # 1. Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            role VARCHAR(50) DEFAULT 'developer',
            is_active TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # 2. Projects table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            user_email VARCHAR(255) DEFAULT 'developer@mare.ai',
            description TEXT,
            goal TEXT,
            source VARCHAR(100) DEFAULT 'user',
            priority VARCHAR(50) DEFAULT 'high',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_projects_user (user_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # 3. Files table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS files (
            id INT AUTO_INCREMENT PRIMARY KEY,
            node_id VARCHAR(255) UNIQUE NOT NULL,
            parent_id VARCHAR(255),
            project_name VARCHAR(255) DEFAULT 'default',
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            content LONGTEXT,
            agent_name VARCHAR(100),
            agent_contents LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_files_node_id (node_id),
            INDEX idx_files_project (project_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # 4. Conversations table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            convo_id VARCHAR(255) UNIQUE NOT NULL,
            project_name VARCHAR(255) DEFAULT 'default',
            agent VARCHAR(100) NOT NULL,
            title VARCHAR(255),
            content LONGTEXT NOT NULL,
            timestamp VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_conversations_convo_id (convo_id),
            INDEX idx_conversations_project (project_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # 5. Workflows table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflows (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_name VARCHAR(255) UNIQUE NOT NULL,
            nodes LONGTEXT,
            edges LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_workflows_project (project_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # 6. Agents state table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS agents_state (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agent_name VARCHAR(100) NOT NULL,
            project_name VARCHAR(255) DEFAULT 'default',
            script_code LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_agent_project (agent_name, project_name),
            INDEX idx_agents_state_name (agent_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # 7. Audit logs table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            threat_type VARCHAR(100) NOT NULL,
            severity VARCHAR(50) NOT NULL,
            details TEXT,
            client_ip VARCHAR(50),
            blocked TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)



        conn.commit()
        conn.close()
        logger.info(f"MySQL schema successfully initialized in database '{DB_NAME}' on {DB_HOST}:{DB_PORT}")

    else:
        # SQLite schema fallback
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
        logger.info(f"SQLite schema initialized successfully at {DB_PATH}")


def get_db():
    """FastAPI dependency for database session (MySQL or SQLite)."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
