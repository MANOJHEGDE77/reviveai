import os
import sys
from pathlib import Path

# Ensure backend package directory is in Python module search path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Ensure VERCEL flag is set so config uses /tmp writable database
os.environ["VERCEL"] = "1"

from app.main import app

# Export for Vercel Serverless Function runtime
# Vercel's Python runtime natively wraps ASGI FastAPI apps
app = app
