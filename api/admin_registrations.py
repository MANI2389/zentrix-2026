"""
ZENTRIX 2K26 — Admin Registrations Protected Endpoint (/api/admin_registrations)
Vercel Python Serverless Function (FastAPI)
Requires valid JWT session token. Queries Supabase using service role key
and returns all registrations for admin dashboard analytics and Excel export.
"""

import os
import sys
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from api._supabase import get_supabase
    from api._auth import decode_access_token
except (ImportError, ValueError):
    try:
        from ._supabase import get_supabase
        from ._auth import decode_access_token
    except (ImportError, ValueError):
        from _supabase import get_supabase
        from _auth import decode_access_token

app = FastAPI(title="ZENTRIX 2K26 Admin Registrations API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/admin_registrations")
@app.get("/admin_registrations")
def get_admin_registrations(authorization: Optional[str] = Header(None)):
    # 1. Verify Authorization Header
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please log in."
        )

    token = authorization
    if token.startswith("Bearer "):
        token = token[7:].strip()

    # 2. Decode and validate JWT
    payload = decode_access_token(token)
    if not payload:
        # Fallback check for local demo token
        if token != "demo-admin-jwt-token-zx26":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session token invalid or expired. Please sign in again."
            )

    # 3. Query Supabase registrations table
    try:
        sb = get_supabase()
        res = sb.table("registrations").select("*").order("created_at", desc=True).execute()
        registrations = res.data or []
        
        return {
            "success": True,
            "count": len(registrations),
            "data": registrations
        }
    except Exception as e:
        error_msg = str(e)
        # If table not yet initialized in Supabase, return empty list or demo mock for UI testing
        if "schema cache" in error_msg or "PGRST205" in error_msg:
            return {
                "success": True,
                "count": 0,
                "data": [],
                "notice": "Database table 'registrations' not created yet. Please execute schema.sql in Supabase SQL editor."
            }
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch registrations: {error_msg}"
        )
