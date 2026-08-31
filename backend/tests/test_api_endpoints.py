import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.seeder import seed_demo_data

# Use SQLite in-memory with StaticPool for testing
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

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_demo_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "guardrails" in data
    assert data["guardrails"]["max_retries"] == 2
    assert data["guardrails"]["approval_threshold_inr"] == 50000.0

def test_dashboard_summary_endpoint(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "revenue_at_risk" in data
    assert "successfully_recovered" in data
    assert "recovery_rate" in data
    assert "risk_categories" in data
    assert len(data["risk_categories"]) > 0
    assert "revenue_trend" in data
    assert len(data["revenue_trend"]) == 7
    assert "live_operations" in data

def test_list_incidents_endpoint(client):
    # Test all incidents
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) > 0

    # Test filtering by status
    response = client.get("/api/incidents?status=FAILED")
    assert response.status_code == 200

    # Test filtering by risk level
    response = client.get("/api/incidents?risk_level=HIGH")
    assert response.status_code == 200

    # Test search
    response = client.get("/api/incidents?search=Swiggy")
    assert response.status_code == 200

def test_get_incident_detail_and_investigate(client):
    # List incidents to get an ID
    list_res = client.get("/api/incidents")
    first_incident = list_res.json()[0]
    incident_id = first_incident["id"]

    # Get detail
    detail_res = client.get(f"/api/incidents/{incident_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == incident_id
    assert "customer" in detail
    assert "events" in detail

    # Trigger investigation
    inv_res = client.post(f"/api/incidents/{incident_id}/investigate")
    assert inv_res.status_code == 200

def test_recovery_workflows_and_execute(client):
    # List recovery workflows
    response = client.get("/api/recovery")
    assert response.status_code == 200
    workflows = response.json()
    assert len(workflows) > 0

    wf = workflows[0]
    wf_id = wf["id"]

    # Get detail
    detail_res = client.get(f"/api/recovery/{wf_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == wf_id

    # Execute workflow step
    exec_res = client.post(f"/api/recovery/{wf_id}/execute")
    assert exec_res.status_code == 200
    assert "action_type" in exec_res.json()

def test_approvals_endpoint_and_decision(client):
    # List approvals
    response = client.get("/api/approvals")
    assert response.status_code == 200
    approvals = response.json()
    
    # Check pending approvals
    pending = [a for a in approvals if a["status"] == "PENDING"]
    if pending:
        appr_id = pending[0]["id"]
        # Decide approve
        dec_res = client.post(f"/api/approvals/{appr_id}/decision", json={
            "decision": "APPROVE",
            "operator_notes": "Approved for high-value enterprise recovery",
            "decision_by": "Risk Lead"
        })
        assert dec_res.status_code == 200
        assert dec_res.json()["status"] == "APPROVED"

def test_audit_logs_endpoint(client):
    response = client.get("/api/audit")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0

    # Filter by actor
    response_actor = client.get("/api/audit?actor=REVIVE_AI_AGENT")
    assert response_actor.status_code == 200

    # Filter with search
    response_search = client.get("/api/audit?search=PAY_")
    assert response_search.status_code == 200

def test_simulation_trigger_resolve_and_demo(client):
    # Trigger simulation
    sim_res = client.post("/api/simulation/trigger", json={
        "customer_name": "Test Quick Commerce",
        "amount": 18500.0,
        "failure_category": "TEMPORARY_DECLINE",
        "payment_method_type": "CARD",
        "auto_execute": True
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    payment_id = sim_data["id"]
    assert sim_data["status"] in ["IN_RECOVERY", "WAITING", "FAILED"]

    # Resolve payment as recovered
    res_res = client.post(f"/api/simulation/resolve/{payment_id}")
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RECOVERED"

    # Run guided 10-step demo scenario
    demo_res = client.post("/api/simulation/demo-scenario")
    assert demo_res.status_code == 200
    demo_data = demo_res.json()
    assert demo_data["status"] == "COMPLETED"
    assert len(demo_data["steps_completed"]) == 10

def test_simulation_reset(client):
    reset_res = client.post("/api/simulation/reset")
    assert reset_res.status_code == 200
    assert "reset and seeded" in reset_res.json()["message"]
