"""
ZENTRIX 2K26 — Main FastAPI Application Entrypoint
Unified entrypoint for Vercel deployment and local development.
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

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

# Include API Routers
app.include_router(register_app.router)
app.include_router(admin_login_app.router)
app.include_router(admin_reg_app.router)

@app.get("/api/health")
@app.get("/health")
def healthcheck():
    return {"status": "ok", "event": "ZENTRIX 2K26"}

# Mount static asset directories
assets_dir = os.path.join(BASE_DIR, "assets")
css_dir = os.path.join(BASE_DIR, "css")
js_dir = os.path.join(BASE_DIR, "js")

if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
if os.path.isdir(css_dir):
    app.mount("/css", StaticFiles(directory=css_dir), name="css")
if os.path.isdir(js_dir):
    app.mount("/js", StaticFiles(directory=js_dir), name="js")

# Serve HTML pages
@app.get("/")
def serve_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/register")
@app.get("/register.html")
def serve_register():
    return FileResponse(os.path.join(BASE_DIR, "register.html"))

@app.get("/register-success")
@app.get("/register-success.html")
def serve_success():
    return FileResponse(os.path.join(BASE_DIR, "register-success.html"))

@app.get("/admin-login")
@app.get("/admin-login.html")
def serve_admin_login():
    return FileResponse(os.path.join(BASE_DIR, "admin-login.html"))

@app.get("/admin-dashboard")
@app.get("/admin-dashboard.html")
def serve_admin_dashboard():
    return FileResponse(os.path.join(BASE_DIR, "admin-dashboard.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
