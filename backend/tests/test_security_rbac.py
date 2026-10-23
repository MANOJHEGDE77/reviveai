import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.seeder import seed_demo_data
from app.config import settings
from app.auth import create_access_token, Operator, Role

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_demo_data(db)
    db.close()
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_auth_login_success(client):
    res = client.post("/api/auth/login", json={
        "email": "risk.lead@reviveai.io",
        "password": "RiskLead2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["operator"]["role"] == "RISK_LEAD"
    assert data["operator"]["email"] == "risk.lead@reviveai.io"

def test_auth_login_invalid_password(client):
    res = client.post("/api/auth/login", json={
        "email": "risk.lead@reviveai.io",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401

def test_unauthenticated_requests_rejected_in_strict_mode(client):
    # Enable strict auth
    original_strict = settings.STRICT_AUTH
    settings.STRICT_AUTH = True
    try:
        # 1. Unauthenticated approval decision
        res1 = client.post("/api/approvals/1/decision", json={"decision": "APPROVE"})
        assert res1.status_code == 401

        # 2. Unauthenticated recovery execution
        res2 = client.post("/api/recovery/1/execute")
        assert res2.status_code == 401

        # 3. Unauthenticated admin reset
        res3 = client.post("/api/simulation/reset")
        assert res3.status_code == 401
    finally:
        settings.STRICT_AUTH = original_strict

def test_viewer_role_cannot_execute_recovery(client):
    viewer_op = Operator(id="OP-V1", email="viewer@reviveai.io", name="Viewer Test", role=Role.VIEWER)
    token = create_access_token(viewer_op)
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to execute workflow action
    res = client.post("/api/recovery/1/execute", headers=headers)
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_operator_cannot_approve_high_value(client):
    op = Operator(id="OP-O1", email="ops@reviveai.io", name="Operator Test", role=Role.OPERATOR)
    token = create_access_token(op)
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to approve
    res = client.post("/api/approvals/1/decision", json={"decision": "APPROVE"}, headers=headers)
    assert res.status_code == 403
    assert "Required roles: ['RISK_LEAD', 'ADMIN']" in res.json()["detail"]

def test_risk_lead_can_approve_and_identity_is_derived_server_side(client):
    risk_lead = Operator(id="OP-RL1", email="lead@reviveai.io", name="Aditi Rao", role=Role.RISK_LEAD)
    token = create_access_token(risk_lead)
    headers = {"Authorization": f"Bearer {token}"}

    # Ingest high-value payment to ensure an approval exists
    client.post("/api/simulation/trigger", json={
        "customer_name": "Test High Value Corp",
        "amount": 75000,
        "failure_category": "TEMPORARY_DECLINE",
        "auto_execute": False
    }, headers=headers)

    # Get pending approval
    pending_res = client.get("/api/approvals?status=PENDING", headers=headers)
    assert pending_res.status_code == 200
    approvals = pending_res.json()
    assert len(approvals) > 0
    appr_id = approvals[0]["id"]

    # Try sending a spoofed client decision_by
    res = client.post(
        f"/api/approvals/{appr_id}/decision",
        json={"decision": "APPROVE", "operator_notes": "Verified verified", "decision_by": "SPOOFED_CEO"},
        headers=headers
    )
    assert res.status_code == 200
    result = res.json()
    assert result["status"] == "APPROVED"
    # Verify server-side derived identity: must NOT be SPOOFED_CEO!
    assert "SPOOFED_CEO" not in result["decision_by"]
    assert "Aditi Rao" in result["decision_by"]
    assert "RISK_LEAD" in result["decision_by"]

def test_anti_bypass_guard_on_pending_approval_workflow(client):
    risk_lead = Operator(id="OP-RL1", email="lead@reviveai.io", name="Aditi Rao", role=Role.RISK_LEAD)
    token = create_access_token(risk_lead)
    headers = {"Authorization": f"Bearer {token}"}

    # Ingest high-value payment which enters PENDING_APPROVAL
    ingest_res = client.post("/api/simulation/trigger", json={
        "customer_name": "Bypass Attempt Merchant",
        "amount": 95000,
        "failure_category": "TEMPORARY_DECLINE",
        "auto_execute": False
    }, headers=headers)
    assert ingest_res.status_code == 200
    payment_data = ingest_res.json()
    wf_id = payment_data["workflow"]["id"]

    # Directly execute the workflow action without going through /approvals
    bypass_res = client.post(f"/api/recovery/{wf_id}/execute", headers=headers)
    assert bypass_res.status_code == 403
    assert "awaiting Risk Lead approval" in bypass_res.json()["detail"]
