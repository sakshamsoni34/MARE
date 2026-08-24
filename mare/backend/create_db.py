import sqlite3
import os

# Connect to SQLite file
db_path = os.path.join(os.path.dirname(__file__), 'mare.db')

try:
    # This will create mare.db if it doesn't exist
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Drop existing tables for a clean slate
    print("Dropping existing tables if any...")
    cursor.execute("DROP TABLE IF EXISTS users")
    cursor.execute("DROP TABLE IF EXISTS projects")
    cursor.execute("DROP TABLE IF EXISTS files")
    cursor.execute("DROP TABLE IF EXISTS conversations")
    cursor.execute("DROP TABLE IF EXISTS workflows")
    cursor.execute("DROP TABLE IF EXISTS agents_state")

    # Table queries
    tables = []

    tables.append("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      goal TEXT,
      source TEXT,
      priority TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('file', 'folder')) NOT NULL,
      content TEXT,
      agent_name TEXT,
      agent_contents TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    tables.append("CREATE INDEX IF NOT EXISTS idx_files_node_id ON files (node_id)")

    tables.append("""
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      convo_id TEXT NOT NULL,
      agent TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      timestamp TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    tables.append("CREATE INDEX IF NOT EXISTS idx_conversations_convo_id ON conversations (convo_id)")

    tables.append("""
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT,
      nodes TEXT,
      edges TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS agents_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      script_code TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    tables.append("CREATE INDEX IF NOT EXISTS idx_agents_state_name ON agents_state (agent_name)")

    for query in tables:
        cursor.execute(query)

    conn.commit()
    print("Database 'mare.db' and tables created successfully matching the React workflow structure.")

except sqlite3.Error as err:
    print(f"Error: {err}")
finally:
    if 'conn' in locals():
        cursor.close()
        conn.close()
