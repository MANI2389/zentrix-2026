"""
ZENTRIX 2K26 — Unified FastAPI Entrypoint for Vercel Serverless Functions
Consolidates /api/register, /api/admin_login, and /api/admin_registrations.
"""

import os
import sys

# Ensure root directory is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from main import app
