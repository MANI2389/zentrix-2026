"""
ZENTRIX 2K26 — Unified Local Development Server
Runs the FastAPI server with all /api/* endpoints and static file serving on port 3000.
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Add root directory to python module search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.register import app as register_app
from api.admin_login import app as admin_login_app
from api.admin_registrations import app as admin_reg_app

app = FastAPI(title="ZENTRIX 2K26 Local Dev Server")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers from serverless function modules
app.include_router(register_app.router)
app.include_router(admin_login_app.router)
app.include_router(admin_reg_app.router)

# Healthcheck ping
@app.get("/api/health")
def healthcheck():
    return {"status": "ok", "event": "ZENTRIX 2K26"}

# Root index route
@app.get("/")
def serve_index():
    return FileResponse("index.html")

# Mount static files for HTML, CSS, JS, Assets
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("Starting ZENTRIX 2K26 Local Server at http://localhost:3000")
    print("=" * 60)
    uvicorn.run("dev_server:app", host="0.0.0.0", port=3000, reload=False)
