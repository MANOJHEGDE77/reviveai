@echo off
title ReviveAI - Development Server Launcher
echo ========================================================
echo         ReviveAI Development Server Launcher
echo ========================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.12+.
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js 20+.
    pause
    exit /b 1
)

echo [1/2] Starting Backend (FastAPI + Uvicorn) on http://127.0.0.1:8000 ...
start "ReviveAI Backend" cmd /k "cd backend && (if exist ..\.venv\Scripts\activate (call ..\.venv\Scripts\activate) else (if exist .venv\Scripts\activate (call .venv\Scripts\activate))) && python -m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload"

echo [2/2] Starting Frontend (React + Vite) on http://127.0.0.1:5173 ...
start "ReviveAI Frontend" cmd /k "cd frontend && npm run dev"


echo.
echo ========================================================
echo  All services started!
echo  - Frontend: http://127.0.0.1:5173
echo  - Backend API: http://127.0.0.1:8000
echo  - Swagger Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause
