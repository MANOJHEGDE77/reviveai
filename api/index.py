import os
import sys
from pathlib import Path

# Ensure backend package directory is in Python module search path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Ensure VERCEL flag is set so config uses /tmp writable database
os.environ["VERCEL"] = "1"

from app.main import app as _fastapi_app

# Robust ASGI wrapper for Vercel serverless execution
async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")
        if path.startswith("/api/index.py"):
            rest = path[len("/api/index.py"):]
            scope["path"] = f"/api{rest}" if rest.startswith("/") else ("/api" + ("/" + rest if rest else ""))
        elif not path.startswith("/api"):
            scope["path"] = f"/api{path}"
    await _fastapi_app(scope, receive, send)

