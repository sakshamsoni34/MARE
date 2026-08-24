import aiosqlite
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

# Return an aiosqlite connection (which acts similar to a pool in simple scenarios)
async def get_db_pool():
    db_path = os.path.join(os.path.dirname(__file__), 'mare.db')
    conn = await aiosqlite.connect(db_path)
    # Set row factory to return dicts like aiomysql.DictCursor
    conn.row_factory = aiosqlite.Row
    return conn
