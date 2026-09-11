"""
ZENTRIX 2K26 — Admin Authentication Endpoint (/api/admin_login)
Vercel Python Serverless Function (FastAPI)
Verifies admin credentials with bcrypt against Supabase admins table,
and issues signed JWT session token.
"""

import os
import sys
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from ._supabase import get_supabase
    from ._auth import verify_password, create_access_token
except (ImportError, ValueError):
    from _supabase import get_supabase
    from _auth import verify_password, create_access_token

app = FastAPI(title="ZENTRIX 2K26 Admin Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Built-in seed fallback hash for 'admin@thekavery.org' / 'admin@zentrix2026'
# Ensures initial setup works even before schema.sql is executed in Supabase SQL editor
SEED_ADMIN_EMAIL = "admin@thekavery.org"
SEED_ADMIN_HASH = "$2b$12$Kx9aj/kxCfn7OGn48C1v0e1L5FNZZk.Od0DR.hTeVCYV4Umi/ckFe"

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

@app.post("/api/admin_login")
@app.post("/admin_login")
def admin_login(payload: AdminLoginRequest):
    email = payload.email.lower().strip()
    plain_password = payload.password

    admin_record = None

    # 1. Attempt lookup in Supabase admins table
    try:
        sb = get_supabase()
        res = sb.table("admins").select("*").eq("email", email).execute()
        if res.data and len(res.data) > 0:
            admin_record = res.data[0]
    except Exception as e:
        # If table is not created yet, log and check fallback
        print(f"Supabase admins query exception: {e}")

    # 2. Check fallback for initial bootstrap if table missing or record empty
    if not admin_record and email == SEED_ADMIN_EMAIL:
        admin_record = {
            "id": "bootstrap-admin-001",
            "email": SEED_ADMIN_EMAIL,
            "password_hash": SEED_ADMIN_HASH,
            "role": "superadmin"
        }

    # 3. Verify existence & password hash
    if not admin_record:
        # Return generic error with NO field hints
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    is_valid = verify_password(plain_password, admin_record["password_hash"])
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # 4. Generate JWT session token
    token_data = {
        "sub": str(admin_record["id"]),
        "email": admin_record["email"],
        "role": admin_record.get("role", "admin")
    }
    access_token = create_access_token(token_data)

    return {
        "success": True,
        "token": access_token,
        "email": admin_record["email"],
        "role": admin_record.get("role", "admin"),
        "message": "Authentication successful"
    }
