import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def seed_db():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Saksham@2006",
            database="mare"
        )
        cursor = conn.cursor()

        # Insert User
        cursor.execute("""
            INSERT INTO users (email, password_hash, first_name, last_name, is_active)
            VALUES ('test@example.com', 'hashed_password_123', 'John', 'Doe', 1)
        """)
        user_id = cursor.lastrowid

        # Insert Agent
        cursor.execute("""
            INSERT INTO agents (user_id, name, description, system_prompt, model_name, is_active)
            VALUES (%s, 'ResearchAssistant', 'Helps with research', 'You are a helpful AI assistant.', 'mistral-large', 1)
        """, (user_id,))
        agent_id = cursor.lastrowid

        # Insert Workflow
        cursor.execute("""
            INSERT INTO workflows (user_id, name, description, file_name, nodes_count, edges_count, configuration, is_active)
            VALUES (%s, 'Default Workflow', 'Test workflow setup', 'workflow.json', 5, 4, '{"key": "value"}', 1)
        """, (user_id,))
        workflow_id = cursor.lastrowid

        # Insert Chat Session
        cursor.execute("""
            INSERT INTO chat_sessions (user_id, agent_id, title, status)
            VALUES (%s, %s, 'First Chat', 'active')
        """, (user_id, agent_id))
        session_id = cursor.lastrowid

        # Insert Chat Message
        cursor.execute("""
            INSERT INTO chat_messages (session_id, sender_type, content, tokens_used)
            VALUES (%s, 'user', 'Hello, AI!', 5)
        """, (session_id,))

        cursor.execute("""
            INSERT INTO chat_messages (session_id, sender_type, content, tokens_used)
            VALUES (%s, 'agent', 'Hello! How can I help you today?', 10)
        """, (session_id,))

        # Commit all changes
        conn.commit()
        print("Database seeded with dummy data successfully!")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    seed_db()
