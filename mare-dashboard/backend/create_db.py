import pymysql

DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = "Saksham@2006"
DB_NAME = "MARE"

def create_database():
    try:
        # Connect to MySQL server (without specifying a database)
        connection = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD
        )
        with connection.cursor() as cursor:
            # Create the database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME};")
            print(f"Database '{DB_NAME}' checked/created successfully.")
        connection.commit()
    except Exception as e:
        print(f"Error creating database: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    create_database()
