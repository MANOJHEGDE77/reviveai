from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import (
    Operator,
    LoginRequest,
    TokenResponse,
    Role,
    OPERATORS_STORE,
    _hash_password,
    create_access_token,
    get_current_operator,
    require_roles
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    """
    Authenticates an operator using email and password.
    Returns a sovereign Bearer JWT token with signed role claims.
    """
    op_data = OPERATORS_STORE.get(body.email.strip().lower())
    if not op_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Unknown operator."
        )

    expected_hash = _hash_password(body.password)
    if op_data["password_hash"] != expected_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Password mismatch."
        )

    operator = Operator(
        id=op_data["id"],
        email=op_data["email"],
        name=op_data["name"],
        role=op_data["role"],
        is_active=op_data["is_active"]
    )
    token = create_access_token(operator)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        operator=operator,
        expires_in_seconds=86400
    )

@router.get("/me", response_model=Operator)
def get_current_user(operator: Operator = Depends(get_current_operator)):
    """Returns the currently authenticated operator identity and assigned RBAC role."""
    return operator

@router.post("/switch-role", response_model=TokenResponse)
def switch_operator_role_for_demo(role: Role):
    """
    Convenience endpoint for testing, audit inspection, and governance demonstrations.
    Generates a valid signed Bearer token for the requested role.
    """
    role_email_map = {
        Role.ADMIN: "admin@reviveai.io",
        Role.RISK_LEAD: "risk.lead@reviveai.io",
        Role.OPERATOR: "operator@reviveai.io",
        Role.VIEWER: "viewer@reviveai.io"
    }
    email = role_email_map.get(role, "risk.lead@reviveai.io")
    op_data = OPERATORS_STORE[email]
    operator = Operator(
        id=op_data["id"],
        email=op_data["email"],
        name=op_data["name"],
        role=op_data["role"],
        is_active=True
    )
    token = create_access_token(operator)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        operator=operator,
        expires_in_seconds=86400
    )
