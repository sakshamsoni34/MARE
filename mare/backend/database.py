import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Saksham@2006",
        database="mare"
    )
