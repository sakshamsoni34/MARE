import sqlite3
import os

def clear_db():
    db_path = os.path.join(os.path.dirname(__file__), 'mare.db')
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        tables = [
            "users",
            "projects",
            "files",
            "conversations",
            "workflows",
            "agents_state"
        ]

        for table in tables:
            cursor.execute(f"DELETE FROM {table}")

        conn.commit()
        print("All mock data removed successfully! Database is completely empty.")

    except sqlite3.Error as err:
        print(f"Error: {err}")
    finally:
        if 'conn' in locals():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    clear_db()
