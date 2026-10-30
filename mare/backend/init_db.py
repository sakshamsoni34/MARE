import asyncio
import os
import sys

# Ensure current directory is on python path
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, DB_PATH

async def main():
    print(f"Initializing database at {DB_PATH}...")
    await init_db()
    print("Database initialization complete.")

if __name__ == "__main__":
    asyncio.run(main())

