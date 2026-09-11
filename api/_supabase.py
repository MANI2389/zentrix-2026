"""
ZENTRIX 2K26 — Supabase Client Initializer (Serverless Backend Only)
Initializes Supabase with the service_role key to bypass RLS securely server-side.
Never expose this key to client-side browsers.
"""

import os
from pathlib import Path
from supabase import create_client, Client

# Automatically load .env if running locally
env_path = Path(__file__).resolve().parent.parent / '.env'
if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ.setdefault(key.strip(), val.strip())

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

_supabase_client: Client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be configured."
        )

    _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client
