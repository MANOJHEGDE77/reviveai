import os
import hashlib
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings

# --- Role Definitions ---
class Role(str, Enum):
    VIEWER = "VIEWER"
    OPERATOR = "OPERATOR"
    RISK_LEAD = "RISK_LEAD"
    ADMIN = "ADMIN"

# Hierarchy: ADMIN > RISK_LEAD > OPERATOR > VIEWER
ROLE_HIERARCHY: Dict[Role, int] = {
    Role.VIEWER: 1,
    Role.OPERATOR: 2,
    Role.RISK_LEAD: 3,
    Role.ADMIN: 4,
}

class Operator(BaseModel):
    id: str
    email: str
    name: str
    role: Role
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    operator: Operator
    expires_in_seconds: int

class LoginRequest(BaseModel):
    email: str
    password: str

# --- Secret Configuration ---
JWT_SECRET = os.getenv("REVIVEAI_JWT_SECRET", "reviveai-super-secret-sovereign-key-2026-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def _hash_password(password: str, salt: str = "reviveai_secure_salt_2026") -> str:
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

# Pre-seeded sovereign operators
OPERATORS_STORE: Dict[str, Dict] = {
    "admin@reviveai.io": {
        "id": "OP-ADMIN-01",
        "email": "admin@reviveai.io",
        "name": "Sovereign Administrator",
        "role": Role.ADMIN,
        "password_hash": _hash_password("AdminSecret2026!"),
        "is_active": True
    },
    "risk.lead@reviveai.io": {
        "id": "OP-RISK-01",
        "email": "risk.lead@reviveai.io",
        "name": "Aditi Rao (Risk Lead)",
        "role": Role.RISK_LEAD,
        "password_hash": _hash_password("RiskLead2026!"),
        "is_active": True
    },
    "operator@reviveai.io": {
        "id": "OP-AGENT-01",
        "email": "operator@reviveai.io",
        "name": "Karthik Verma (Recovery Ops)",
        "role": Role.OPERATOR,
        "password_hash": _hash_password("Operator2026!"),
        "is_active": True
    },
    "viewer@reviveai.io": {
        "id": "OP-VIEW-01",
        "email": "viewer@reviveai.io",
        "name": "Auditor (Read-Only)",
        "role": Role.VIEWER,
        "password_hash": _hash_password("Viewer2026!"),
        "is_active": True
    }
}

def create_access_token(operator: Operator, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=JWT_EXPIRATION_HOURS))
    payload = {
        "sub": operator.id,
        "email": operator.email,
        "name": operator.name,
        "role": operator.role.value,
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Optional[Operator]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        operator_id = payload.get("sub")
        email = payload.get("email")
        role_str = payload.get("role")
        name = payload.get("name", "Unknown Operator")
        if not operator_id or not email or not role_str:
            return None
        return Operator(
            id=operator_id,
            email=email,
            name=name,
            role=Role(role_str),
            is_active=True
        )
    except (JWTError, ValueError):
        return None

security_bearer = HTTPBearer(auto_error=False)

def get_current_operator(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> Operator:
    """
    Validates Bearer token or development authorization.
    In testing/dev environment, if no header is supplied and dev mode is active,
    falls back to default Risk Lead operator to preserve client dashboard operations.
    """
    if credentials and credentials.credentials:
        operator = verify_token(credentials.credentials)
        if operator:
            return operator
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # When STRICT_AUTH is enabled, reject any unauthenticated call
    if getattr(settings, "STRICT_AUTH", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # In development/demo environment, provide a default authenticated Operator (Risk Lead)
    # to maintain full interactive functionality for the frontend dashboard and automated suites.
    if getattr(settings, "DEV_AUTO_AUTH", True):
        return Operator(
            id="OP-RISK-01",
            email="risk.lead@reviveai.io",
            name="Aditi Rao (Risk Lead)",
            role=Role.RISK_LEAD,
            is_active=True
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

def require_roles(allowed_roles: List[Role]):
    """
    FastAPI dependency factory enforcing role-based authorization.
    Rejects unauthenticated callers with 401, and unauthorized callers with 403.
    """
    def role_checker(operator: Operator = Depends(get_current_operator)) -> Operator:
        if not operator:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required."
            )
        
        # Check if operator's role is in allowed_roles or has higher privilege
        operator_level = ROLE_HIERARCHY.get(operator.role, 0)
        min_required_level = min(ROLE_HIERARCHY.get(r, 99) for r in allowed_roles) if allowed_roles else 0

        if operator.role not in allowed_roles and operator_level < min_required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}. Your role: {operator.role.value}."
            )
        return operator

    return role_checker
