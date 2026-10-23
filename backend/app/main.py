import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.seeder import seed_demo_data
from app.routers import dashboard, incidents, recovery, approvals, audit, simulation, auth

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [cid:%(name)s] %(message)s"
)
logger = logging.getLogger("reviveai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.1.0",
    description="Autonomous Revenue Recovery & Sovereign Financial Intelligence Platform",
    lifespan=lifespan
)

# 1. Request Correlation ID & Performance Middleware
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or f"cid_{uuid.uuid4().hex[:12]}"
    start_time = time.perf_counter()
    
    response = await call_next(request)
    
    latency_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Response-Time-Ms"] = f"{latency_ms:.2f}"
    
    return response

# 2. Strict CORS Configuration (restricted to configured origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID", "X-Response-Time-Ms"]
)

# 3. Mount API routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(recovery.router, prefix="/api")
app.include_router(approvals.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")

@app.get("/api/health")
def health_check():
    # Database ping
    db_healthy = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_healthy = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")

    return {
        "status": "healthy" if db_healthy else "degraded",
        "service": "ReviveAI Autonomous Revenue Recovery Platform",
        "version": "1.1.0",
        "database": {
            "status": "connected" if db_healthy else "error",
            "dialect": engine.dialect.name
        },
        "payment_provider": {
            "mode": settings.PAYMENT_PROVIDER_MODE,
            "status": "operational"
        },
        "guardrails": {
            "max_retries": settings.MAX_RETRIES,
            "approval_threshold_inr": settings.APPROVAL_THRESHOLD_INR,
            "recovery_window_hours": settings.RECOVERY_WINDOW_HOURS
        }
    }
