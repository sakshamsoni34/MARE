from sqlalchemy import create_engine
from models import Base
from database import DB_URL

# Create a sync engine URL from the async one
sync_db_url = DB_URL.replace("mysql+aiomysql://", "mysql+pymysql://")

def init_db():
    engine = create_engine(sync_db_url, echo=True)
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully.")

if __name__ == "__main__":
    init_db()
