import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.seeder import seed_demo_data
from app.config import settings
from app.auth import create_access_token, Operator, Role
from app.models import Payment, RecoveryWorkflow, RecoveryAction, IdempotencyRecord, Customer
from app.payment_providers.base import ActionExecutionState
from app.scheduler import DurableRecoveryScheduler
from app.guardrails import GuardrailEngine
from app.idempotency import IdempotencyManager
from app.schemas import AiDiagnosisResult, RecoveryStrategyEnum, RiskLevelEnum, FailureCategoryEnum, DiagnosisSourceEnum
from pydantic import ValidationError

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

@pytest.fixture
def operator_headers():
    op = Operator(id="OP-TEST-1", email="operator@reviveai.io", name="Test Ops", role=Role.OPERATOR)
    token = create_access_token(op)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def risk_lead_headers():
    rl = Operator(id="OP-RL-1", email="lead@reviveai.io", name="Test Risk Lead", role=Role.RISK_LEAD)
    token = create_access_token(rl)
    return {"Authorization": f"Bearer {token}"}


def test_idempotency_key_deduplication(client, operator_headers):
    """Sending the same request with the same Idempotency-Key returns the cached response."""
    idem_key = "idemp-test-unique-key-001"
    headers = {**operator_headers, "Idempotency-Key": idem_key}

    payload = {
        "customer_name": "Idempotent Retailer",
        "customer_email": "idem@retail.in",
        "customer_phone": "+91 99999 11111",
        "customer_ltv": 45000.0,
        "customer_successful_txns": 4,
        "amount": 12500.0,
        "failure_category": "TEMPORARY_DECLINE",
        "failure_reason": "Card network timeout",
        "payment_method_type": "CARD",
        "auto_execute": False
    }

    # First request
    res1 = client.post("/api/incidents", json=payload, headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    created_id = data1["id"]

    # Second request with identical payload and Idempotency-Key
    res2 = client.post("/api/incidents", json=payload, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == created_id


def test_concurrent_idempotency_conflict():
    """Simulating an in-flight locked key throws 409 Conflict."""
    db = TestingSessionLocal()
    try:
        locked_record = IdempotencyRecord(
            idempotency_key="locked-in-flight-key",
            endpoint="/api/recovery/1/execute",
            request_hash="dummyhash123",
            status="PROCESSING",
            created_at=datetime.now(timezone.utc)
        )
        db.add(locked_record)
        db.commit()

        # Check in IdempotencyManager
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            IdempotencyManager.check_or_acquire_lock(
                db=db,
                idempotency_key="locked-in-flight-key",
                endpoint="/api/recovery/1/execute",
                request_data={"action": "retry"}
            )
        assert exc_info.value.status_code == 409
        assert "actively being processed" in exc_info.value.detail
    finally:
        db.close()


def test_revenue_not_incremented_without_authoritative_settlement():
    """Ensure a guardrail passing does not increment recovered revenue; only verified settlement does."""
    db = TestingSessionLocal()
    try:
        cust = Customer(
            customer_ref="CUS_HONEST_1",
            name="Honest Merchant",
            email="honest@merch.in",
            payment_method_masked="•••• 4321",
            payment_method_type="UPI",
            lifetime_value=20000.0,
            successful_transactions=2,
            failed_transactions=1,
            health_score=85
        )
        db.add(cust)
        db.flush()

        payment = Payment(
            payment_ref="PAY_HONEST_1",
            customer_id=cust.id,
            amount=25000.0,
            currency="INR",
            status="IN_RECOVERY",
            failure_category="TEMPORARY_DECLINE",
            risk_level="LOW",
            recovery_probability=0.85,
            is_simulated=False,
            settlement_evidence=None
        )
        db.add(payment)
        db.flush()

        # Guardrail passes
        is_permitted, status, reason = GuardrailEngine.evaluate_proposed_action(payment, None, "DELAYED_RETRY")
        assert is_permitted is True
        assert status == "PASSED_ALL_GUARDRAILS"

        # Check payment status: still IN_RECOVERY, NOT RECOVERED!
        assert payment.status == "IN_RECOVERY"
        assert payment.settlement_evidence is None

        # Authoritative settlement arrives
        from app.recovery_engine import RevenueRecoveryEngine
        evidence = {
            "source": "RAZORPAY_CAPTURE_WEBHOOK",
            "provider_payment_id": "pay_live_test_778899",
            "settled_at": datetime.now(timezone.utc).isoformat(),
            "amount_settled": 25000.0
        }
        resolved = RevenueRecoveryEngine.resolve_payment_success(db, payment, settlement_evidence=evidence)
        assert resolved.status == "RECOVERED"
        assert resolved.settlement_evidence is not None
        assert "pay_live_test_778899" in resolved.settlement_evidence
    finally:
        db.close()


def test_durable_scheduler_expired_recovery_window():
    """Verify that the durable scheduler expires workflows when the 24h window has elapsed."""
    db = TestingSessionLocal()
    try:
        cust = Customer(
            customer_ref="CUS_SCHED_1",
            name="Expired Customer",
            email="expired@customer.in",
            payment_method_masked="•••• 9999",
            payment_method_type="CARD",
            lifetime_value=15000.0,
            successful_transactions=1,
            failed_transactions=2,
            health_score=70
        )
        db.add(cust)
        db.flush()

        old_timestamp = datetime.now(timezone.utc) - timedelta(hours=25)
        payment = Payment(
            payment_ref="PAY_EXPIRED_01",
            customer_id=cust.id,
            amount=9900.0,
            currency="INR",
            status="IN_RECOVERY",
            failure_category="TEMPORARY_DECLINE",
            risk_level="MEDIUM",
            created_at=old_timestamp
        )
        db.add(payment)
        db.flush()

        workflow = RecoveryWorkflow(
            workflow_ref="RV-EXP01",
            payment_id=payment.id,
            trigger_reason="Timeout",
            strategy="DELAYED_RETRY",
            current_step="WAITING_FOR_RETRY",
            attempts=1,
            max_attempts=2,
            status="ACTIVE",
            created_at=old_timestamp,
            deadline_time=old_timestamp + timedelta(hours=24) # expired 1 hour ago
        )
        db.add(workflow)
        db.commit()

        # Run scheduler check
        results = DurableRecoveryScheduler.process_all(db)
        assert results["expired_windows"] >= 1

        db.refresh(workflow)
        db.refresh(payment)
        assert workflow.status == "EXPIRED"
        assert workflow.current_step == "WINDOW_EXPIRED"
        assert payment.status == "FAILED"
    finally:
        db.close()


def test_durable_scheduler_executes_due_delayed_retries():
    """Verify that delayed retries scheduled in the past are executed by the scheduler."""
    db = TestingSessionLocal()
    try:
        cust = Customer(
            customer_ref="CUS_SCHED_2",
            name="Due Retry Customer",
            email="dueretry@customer.in",
            payment_method_masked="•••• 8888",
            payment_method_type="UPI",
            lifetime_value=30000.0,
            successful_transactions=3,
            failed_transactions=0,
            health_score=95
        )
        db.add(cust)
        db.flush()

        payment = Payment(
            payment_ref="PAY_DUE_01",
            customer_id=cust.id,
            amount=8500.0,
            currency="INR",
            status="WAITING",
            failure_category="TEMPORARY_DECLINE",
            risk_level="LOW"
        )
        db.add(payment)
        db.flush()

        workflow = RecoveryWorkflow(
            workflow_ref="RV-DUE01",
            payment_id=payment.id,
            trigger_reason="Network switch drop",
            strategy="DELAYED_RETRY",
            current_step="WAITING_FOR_SCHEDULED_RETRY",
            attempts=0,
            max_attempts=2,
            status="WAITING",
            scheduled_execution_at=datetime.now(timezone.utc) - timedelta(minutes=5), # Due 5 mins ago
            deadline_time=datetime.now(timezone.utc) + timedelta(hours=23)
        )
        db.add(workflow)
        db.commit()

        results = DurableRecoveryScheduler.process_all(db)
        assert results["scheduled_retries_executed"] >= 1

        db.refresh(workflow)
        assert workflow.attempts == 1
    finally:
        db.close()


def test_ai_diagnosis_schema_strict_validation():
    """Verify strict Pydantic enum validation and numeric bounding on AI proposals."""
    # 1. Valid proposal
    valid_diag = AiDiagnosisResult(
        diagnosis="Issuer timeout during high-traffic window",
        confidence=0.92,
        risk_level=RiskLevelEnum.LOW,
        recommended_action=RecoveryStrategyEnum.DELAYED_RETRY,
        retry_after_minutes=30,
        max_attempts=2,
        reason="Customer has 90+ health score and low dispute history",
        diagnosis_source=DiagnosisSourceEnum.GEMINI_1_5_FLASH
    )
    assert valid_diag.max_attempts == 2
    assert valid_diag.confidence == 0.92

    # 2. Invalid enum should fail validation
    with pytest.raises(ValidationError):
        AiDiagnosisResult(
            diagnosis="Invalid enum proposal",
            confidence=0.9,
            risk_level="INVALID_RISK_LEVEL", # Invalid enum
            recommended_action=RecoveryStrategyEnum.DELAYED_RETRY,
            retry_after_minutes=15,
            max_attempts=2,
            reason="Test"
        )

    # 3. Max attempts > 2 should fail validation (enforcing guardrail bounds)
    with pytest.raises(ValidationError):
        AiDiagnosisResult(
            diagnosis="Attempting 5 retries",
            confidence=0.9,
            risk_level=RiskLevelEnum.LOW,
            recommended_action=RecoveryStrategyEnum.DELAYED_RETRY,
            retry_after_minutes=15,
            max_attempts=5, # Exceeds max 2
            reason="Test"
        )


def test_re_evaluation_guardrail_before_action_execution():
    """If a payment is marked RECOVERED or CANCELLED, execution is blocked even if workflow was active."""
    db = TestingSessionLocal()
    try:
        cust = Customer(
            customer_ref="CUS_REEVAL_1",
            name="Reeval Customer",
            email="reeval@corp.in",
            payment_method_masked="•••• 1111",
            payment_method_type="CARD",
            lifetime_value=12000.0,
            successful_transactions=1,
            failed_transactions=0,
            health_score=90
        )
        db.add(cust)
        db.flush()

        payment = Payment(
            payment_ref="PAY_REEVAL_1",
            customer_id=cust.id,
            amount=5000.0,
            currency="INR",
            status="RECOVERED", # Unexpectedly settled in parallel
            failure_category="TEMPORARY_DECLINE",
            risk_level="LOW"
        )
        db.add(payment)
        db.flush()

        workflow = RecoveryWorkflow(
            workflow_ref="RV-REEVAL-01",
            payment_id=payment.id,
            trigger_reason="Test",
            strategy="SMART_ROUTING",
            current_step="READY",
            attempts=0,
            max_attempts=2,
            status="ACTIVE"
        )
        db.add(workflow)
        db.commit()

        # Immediate re-evaluation
        is_permitted, status, reason = GuardrailEngine.evaluate_proposed_action(payment, workflow, "SMART_ROUTING")
        assert is_permitted is False
        assert status == "BLOCKED_PAYMENT_ALREADY_RECOVERED"
    finally:
        db.close()
