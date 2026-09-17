"""
ZENTRIX 2K26 — Registration API Endpoint (/api/register)
Vercel Python Serverless Function (FastAPI)
Validates registration payload, generates unique Registration ID (ZX26-XXXXX),
and inserts into Supabase registrations table using service role key.
"""

import random
import re
import os
import sys
import string
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from api._supabase import get_supabase

app = FastAPI(title="ZENTRIX 2K26 Registration API")

# Enable CORS for frontend client interactions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_EVENTS = {
    "Startup Spark",
    "Project Expo",
    "Bug Hunters",
    "Prompt Master"
}

class TeamMember(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    department: str = Field(..., min_length=2, max_length=100)
    year: str = Field(..., min_length=2, max_length=50)

class RegistrationRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    college_name: str = Field(..., min_length=2, max_length=255)
    department: str = Field(..., min_length=2, max_length=100)
    year: str = Field(..., min_length=2, max_length=50)
    section: Optional[str] = Field(default="NA", max_length=50)
    register_number: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    event_name: str
    non_technical_events: Optional[List[str]] = Field(default_factory=list)
    team_members: Optional[List[TeamMember]] = Field(default_factory=list)
    total_amount: int = Field(..., gt=0)
    payment_ref: str = Field(..., min_length=6, max_length=50)
    payment_screenshot: Optional[str] = None
    screenshot_filename: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = re.sub(r"\D", "", v)
        if len(clean) < 10:
            raise ValueError("Phone number must contain at least 10 digits.")
        return clean[-10:]  # Standard 10-digit Indian phone

    @field_validator("event_name")
    @classmethod
    def validate_event_name(cls, v: str) -> str:
        if v not in VALID_EVENTS:
            raise ValueError(f"Invalid technical event. Must be one of: {', '.join(sorted(VALID_EVENTS))}")
        return v

    @field_validator("team_members")
    @classmethod
    def validate_team_size(cls, v: List[TeamMember]) -> List[TeamMember]:
        if len(v) > 2:
            raise ValueError("Maximum 2 additional team members allowed (Total team size: 3).")
        return v

def generate_registration_id() -> str:
    """Generate unique Registration ID format: ZX26-XXXXX"""
    suffix = "".join(random.choices(string.digits + "ABCDEFGHJKLMNPQRSTUVWXYZ", k=5))
    return f"ZX26-{suffix}"

@app.post("/api/register", status_code=status.HTTP_201_CREATED)
@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_participant(payload: RegistrationRequest):
    # Verify calculated fee matches headcount: ₹200 * (1 + team_members)
    expected_heads = 1 + len(payload.team_members)
    if expected_heads > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum team size is 3 members."
        )
    expected_amount = expected_heads * 200
    if payload.total_amount != expected_amount:
        # Auto-correct or reject if mismatch
        payload.total_amount = expected_amount

    # Generate unique ID
    reg_id = generate_registration_id()

    # Prepare database record
    record = {
        "id": reg_id,
        "full_name": payload.full_name.strip(),
        "college_name": payload.college_name.strip(),
        "department": payload.department.strip(),
        "year": payload.year.strip(),
        "section": (payload.section or "NA").strip(),
        "register_number": payload.register_number.strip(),
        "email": payload.email.lower().strip(),
        "phone": payload.phone.strip(),
        "event_name": payload.event_name,
        "non_technical_events": payload.non_technical_events,
        "team_members": [m.model_dump() for m in payload.team_members],
        "total_amount": payload.total_amount,
        "payment_ref": payload.payment_ref.strip(),
        "payment_screenshot": payload.payment_screenshot,
        "status": "confirmed"
    }

    try:
        sb = get_supabase()
        response = sb.table("registrations").insert(record).execute()

        return {
            "success": True,
            "registration_id": reg_id,
            "message": "Registration successful! Receipt generated.",
            "total_amount": payload.total_amount,
            "event_name": payload.event_name,
            "team_size": expected_heads
        }
    except Exception as e:
        error_msg = str(e)
        # If table is not created in Supabase yet, provide helpful instruction
        if "schema cache" in error_msg or "PGRST205" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database tables not initialized yet. Please execute schema.sql in your Supabase SQL Editor."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {error_msg}"
        )
