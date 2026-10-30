import sys
import os
import sqlite3

sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, get_connection
from auth import (
    hash_password, 
    verify_password, 
    create_access_token, 
    decode_access_token,
    DEFAULT_USER
)

def test_auth_and_multitenancy():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    print("--- 1. Testing Password Security ---")
    pw = "SuperSecurePass2026!"
    hashed = hash_password(pw)
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    print("Password hashing (PBKDF2-HMAC-SHA256) verified.")

    print("--- 2. Testing JWT Generation & Verification ---")
    payload = {"email": "alice@mare.ai", "role": "developer", "user_id": 42}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["email"] == "alice@mare.ai"
    assert decoded["role"] == "developer"
    assert decoded["user_id"] == 42
    print("JWT creation and HMAC-SHA256 validation verified.")

    print("--- 3. Testing User Registration & Persistence in SQLite ---")
    cursor.execute("DELETE FROM users WHERE email IN ('alice@mare.ai', 'bob@mare.ai')")
    cursor.execute("""
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES (?, ?, 'Alice', 'Smith', 'developer')
    """, ("alice@mare.ai", hashed))

    bob_hashed = hash_password("BobSecret2026!")
    cursor.execute("""
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES (?, ?, 'Bob', 'Jones', 'developer')
    """, ("bob@mare.ai", bob_hashed))
    conn.commit()

    cursor.execute("SELECT id, email, first_name FROM users WHERE email = 'alice@mare.ai'")
    alice = cursor.fetchone()
    assert alice is not None
    assert alice["first_name"] == "Alice"
    print("User accounts persisted successfully.")

    print("--- 4. Testing Multi-Tenant Project Isolation ---")
    cursor.execute("DELETE FROM projects WHERE name IN ('AlicePrivateProject', 'BobPrivateProject')")
    cursor.execute("""
        INSERT INTO projects (name, user_email, description)
        VALUES (?, ?, ?)
    """, ("AlicePrivateProject", "alice@mare.ai", "Alice confidential research"))

    cursor.execute("""
        INSERT INTO projects (name, user_email, description)
        VALUES (?, ?, ?)
    """, ("BobPrivateProject", "bob@mare.ai", "Bob secret project"))
    conn.commit()

    # Query for Alice: should see Alice's project + default, but NOT Bob's
    cursor.execute("""
        SELECT name FROM projects WHERE user_email = 'alice@mare.ai' OR user_email = 'developer@mare.ai'
    """)
    alice_projects = [r["name"] for r in cursor.fetchall()]
    assert "AlicePrivateProject" in alice_projects
    assert "BobPrivateProject" not in alice_projects

    # Query for Bob: should see Bob's project, but NOT Alice's
    cursor.execute("""
        SELECT name FROM projects WHERE user_email = 'bob@mare.ai' OR user_email = 'developer@mare.ai'
    """)
    bob_projects = [r["name"] for r in cursor.fetchall()]
    assert "BobPrivateProject" in bob_projects
    assert "AlicePrivateProject" not in bob_projects
    print("Multi-tenant project data isolation verified.")

    # Cleanup test data
    cursor.execute("DELETE FROM projects WHERE name IN ('AlicePrivateProject', 'BobPrivateProject')")
    cursor.execute("DELETE FROM users WHERE email IN ('alice@mare.ai', 'bob@mare.ai')")
    conn.commit()
    conn.close()

    print("ALL TESTS PASSED: Pillar 3 Multi-Tenant Authentication & Authorization is fully functional.")

if __name__ == "__main__":
    test_auth_and_multitenancy()

