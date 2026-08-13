import mysql.connector

# Connect to MySQL server (without specifying DB first)
try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Saksham@2006"
    )
    cursor = conn.cursor()

    # Create Database
    cursor.execute("CREATE DATABASE IF NOT EXISTS mare")
    print("Database 'mare' created successfully or already exists.")
    
    # Use Database
    cursor.execute("USE mare")

    # Table queries without foreign keys
    tables = []

    tables.append("""
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_email (email)
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS agents (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      system_prompt TEXT,
      model_name VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_agents_user_id (user_id),
      INDEX idx_agents_name (name)
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      agent_id BIGINT NOT NULL,
      title VARCHAR(255),
      status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chat_sessions_user_id (user_id),
      INDEX idx_chat_sessions_agent_id (agent_id),
      INDEX idx_chat_sessions_status (status)
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      session_id BIGINT NOT NULL,
      sender_type ENUM('user', 'agent', 'system') NOT NULL,
      content TEXT NOT NULL,
      tokens_used INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_messages_session_id (session_id),
      INDEX idx_chat_messages_created_at (created_at)
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS workflows (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      file_name VARCHAR(255),
      nodes_count INT DEFAULT 0,
      edges_count INT DEFAULT 0,
      configuration JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_workflows_user_id (user_id)
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS saved_files (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      agent_id BIGINT,
      workflow_id BIGINT,
      folder_name VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(1024) NOT NULL,
      file_size_bytes BIGINT,
      mime_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_saved_files_user_id (user_id),
      INDEX idx_saved_files_folder_name (folder_name),
      INDEX idx_saved_files_folder_file (folder_name, file_name)
    )
    """)

    tables.append("""
    CREATE TABLE IF NOT EXISTS ui_events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT,
      action VARCHAR(255) NOT NULL,
      details JSON,
      folder_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ui_events_user_id (user_id),
      INDEX idx_ui_events_action (action),
      INDEX idx_ui_events_created_at (created_at)
    )
    """)

    for query in tables:
        cursor.execute(query)

    print("Tables created successfully (without foreign keys).")

except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
