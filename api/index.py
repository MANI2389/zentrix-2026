"""
ZENTRIX 2K26 — Unified FastAPI Entrypoint for Vercel Serverless Functions
Consolidates /api/register, /api/admin_login, and /api/admin_registrations.
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure current directory and project root are in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from .register import app as register_app
    from .admin_login import app as admin_login_app
    from .admin_registrations import app as admin_reg_app
except (ImportError, ValueError):
    from api.register import app as register_app
    from api.admin_login import app as admin_login_app
    from api.admin_registrations import app as admin_reg_app

app = FastAPI(title="ZENTRIX 2K26 API")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers from all submodules
app.include_router(register_app.router)
app.include_router(admin_login_app.router)
app.include_router(admin_reg_app.router)

@app.get("/api/health")
@app.get("/health")
def healthcheck():
    return {"status": "ok", "event": "ZENTRIX 2K26"}
