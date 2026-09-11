@echo off
title ZENTRIX 2K26 - Local Server
cd /d "%~dp0"
echo ============================================================
echo   Starting ZENTRIX 2K26 Local Server (FastAPI + Supabase)
echo   Local Web URL : http://localhost:3000
echo   Admin Portal  : http://localhost:3000/admin-login.html
echo ============================================================
python dev_server.py
pause
