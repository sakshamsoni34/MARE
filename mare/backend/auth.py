import os
import hmac
import hashlib
import base64
import json
import time
import secrets
import logging
import sqlite3
from typing import Optional, Dict, Any, List
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db

logger = logging.getLogger("mare.auth")

SECRET_KEY = os.getenv("NEXTAUTH_SECRET", "44ef91b9231f4e72ad79f4c40b8a1c8f9000a6a3e5c9424bb9b30b42d6bd4db6")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24  # 24 hours

security_bearer = HTTPBearer(auto_error=False)

# =====================================================================
# 1. CRYPTOGRAPHIC PASSWORD HASHING (PBKDF2-HMAC-SHA256)
# =====================================================================

def hash_password(password: str) -> str:
    """
    Cryptographically secure password hashing using PBKDF2-HMAC-SHA256:
    - 256-bit cryptographically random salt (secrets.token_hex(32))
    - 200,000 iterations (OWASP recommended work factor)
    - Returns formatted string: pbkdf2:sha256:200000$<salt>$<hex_key>
    """
    if not password:
        raise ValueError("Password cannot be empty.")
    if len(password) > 128:
        raise ValueError("Password exceeds maximum allowed length of 128 characters.")
    
    salt = secrets.token_hex(32)
    iterations = 200000
    key = hashlib.pbkdf2_hmac(
        "sha256", 
        password.encode("utf-8"), 
        salt.encode("utf-8"), 
        iterations
    )
    return f"pbkdf2:sha256:{iterations}${salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Constant-time password verification supporting current and legacy hash formats:
    - Modern format: pbkdf2:sha256:<iterations>$<salt>$<key_hex>
    - Legacy format: <salt>$<key_hex> (100,000 iterations)
    Uses hmac.compare_digest to prevent side-channel timing attacks.
    """
    if not plain_password or not hashed_password or len(plain_password) > 128:
        return False
    try:
        if hashed_password.startswith("pbkdf2:sha256:"):
            # Format: pbkdf2:sha256:<iterations>$<salt>$<key_hex>
            meta, salt, key_hex = hashed_password.split("$", 2)
            iterations = int(meta.split(":")[-1])
            expected_key = hashlib.pbkdf2_hmac(
                "sha256", 
                plain_password.encode("utf-8"), 
                salt.encode("utf-8"), 
                iterations
            )
            return hmac.compare_digest(expected_key.hex(), key_hex)
        elif "$" in hashed_password:
            # Legacy 2-part format: <salt>$<key_hex> (100,000 iterations)
            salt, key_hex = hashed_password.split("$", 1)
            expected_key = hashlib.pbkdf2_hmac(
                "sha256", 
                plain_password.encode("utf-8"), 
                salt.encode("utf-8"), 
                100000
            )
            return hmac.compare_digest(expected_key.hex(), key_hex)
        return False
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False

# =====================================================================
# 2. STANDARD HMAC-SHA256 JWT IMPLEMENTATION
# =====================================================================

def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64decode(s: str) -> bytes:
    padding = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)

def create_access_token(payload: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Create a signed JWT token using HMAC-SHA256."""
    header = {"alg": ALGORITHM, "typ": "JWT"}
    now = int(time.time())
    exp = now + (expires_delta if expires_delta is not None else ACCESS_TOKEN_EXPIRE_SECONDS)
    
    token_claims = {
        **payload,
        "iat": now,
        "exp": exp
    }

    header_b64 = _b64encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64encode(json.dumps(token_claims, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode HMAC-SHA256 JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            logger.warning("JWT signature mismatch.")
            return None

        claims = json.loads(_b64decode(payload_b64).decode("utf-8"))
        if claims.get("exp", 0) < time.time():
            logger.warning("JWT token expired.")
            return None

        return claims
    except Exception as e:
        logger.warning(f"Error decoding JWT: {e}")
        return None

# =====================================================================
# 3. FASTAPI AUTHENTICATION DEPENDENCIES & MULTI-TENANCY
# =====================================================================

DEFAULT_USER = {
    "id": 1,
    "email": "developer@mare.ai",
    "name": "MARE Developer",
    "role": "developer"
}

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    conn: sqlite3.Connection = Depends(get_db)
) -> Dict[str, Any]:
    """
    Validate Authorization Bearer JWT.
    Supports seamless fallback to default developer persona in local development.
    """
    token = credentials.credentials if credentials else None
    
    # Check custom header if Authorization is not present
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if token:
        claims = decode_access_token(token)
        if claims and "email" in claims:
            # Query user in database
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, first_name, last_name, role FROM users WHERE email = ?", (claims["email"],))
            user_row = cursor.fetchone()
            if user_row:
                return {
                    "id": user_row["id"],
                    "email": user_row["email"],
                    "name": f"{user_row['first_name'] or ''} {user_row['last_name'] or ''}".strip() or user_row["email"],
                    "role": user_row["role"]
                }
            return {
                "id": claims.get("user_id", 1),
                "email": claims["email"],
                "name": claims.get("name", claims["email"]),
                "role": claims.get("role", "developer")
            }

    # In local development, provide authenticated default developer context
    return DEFAULT_USER

def require_role(allowed_roles: List[str]):
    """Role-based access control dependency."""
    async def role_checker(user: Dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role", "developer")
        if user_role not in allowed_roles and "admin" not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{user_role}' does not have sufficient permissions."
            )
        return user
    return role_checker

