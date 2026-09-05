import sqlite3
import os

def seed_db():
    db_path = os.path.join(os.path.dirname(__file__), 'mare.db')
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Insert User
        cursor.execute("""
            INSERT INTO users (email, password_hash, first_name, last_name, is_active)
            VALUES ('test@example.com', 'hashed_password_123', 'John', 'Doe', 1)
        """)

        # Insert Project
        cursor.execute("""
            INSERT INTO projects (name, description, goal, source, priority)
            VALUES ('Demo Project', 'A demo project for testing', 'Test functionality', 'user', 'high')
        """)

        # Insert File
        cursor.execute("""
            INSERT INTO files (node_id, parent_id, name, type, content, agent_name)
            VALUES ('root', NULL, 'src', 'folder', NULL, NULL)
        """)
        
        # Insert Conversation
        cursor.execute("""
            INSERT INTO conversations (convo_id, agent, title, content, timestamp)
            VALUES ('convo-1', 'ResearchAssistant', 'First Chat', '[]', '2023-01-01T00:00:00Z')
        """)

        # Insert Workflow
        cursor.execute("""
            INSERT INTO workflows (project_name, nodes, edges)
            VALUES ('Demo Project', '[]', '[]')
        """)

        # Insert Agent State
        cursor.execute("""
            INSERT INTO agents_state (agent_name, script_code)
            VALUES ('ResearchAssistant', 'print("Hello from agent")')
        """)

        # Commit all changes
        conn.commit()
        print("Database seeded with dummy data successfully!")

    except sqlite3.Error as err:
        print(f"Error: {err}")
    finally:
        if 'conn' in locals():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    seed_db()
