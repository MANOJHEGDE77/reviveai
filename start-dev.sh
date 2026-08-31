#!/usr/bin/env bash

set -e

echo "========================================================"
echo "        ReviveAI Development Server Launcher           "
echo "========================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "[ERROR] Python is not installed. Please install Python 3.12+."
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js 20+."
    exit 1
fi

PYTHON_CMD=$(command -v python3 || command -v python)

echo "[1/2] Starting Backend (FastAPI) on http://127.0.0.1:8000 ..."
(
    cd backend
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    fi
    $PYTHON_CMD -m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload
) &
BACKEND_PID=$!

echo "[2/2] Starting Frontend (Vite) on http://127.0.0.1:5173 ..."
(
    cd frontend
    npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo " Services running in background:"
echo " - Frontend: http://127.0.0.1:5173"
echo " - Backend API: http://127.0.0.1:8000"
echo " - Swagger Docs: http://127.0.0.1:8000/docs"
echo " Press Ctrl+C to terminate both servers."
echo "========================================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" SIGINT SIGTERM
wait
