import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def clear_db():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Saksham@2006",
            database="mare"
        )
        cursor = conn.cursor()

        tables = [
            "chat_messages",
            "chat_sessions",
            "saved_files",
            "workflows",
            "ui_events",
            "agents",
            "users"
        ]

        for table in tables:
            cursor.execute(f"TRUNCATE TABLE {table}")

        conn.commit()
        print("All mock data removed successfully! Database is completely empty.")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    clear_db()
