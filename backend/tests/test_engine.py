import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Customer, Payment, RecoveryWorkflow, ApprovalRequest, AuditLog
from app.guardrails import GuardrailEngine
from app.recovery_engine import RevenueRecoveryEngine
from app.ai_agent import AiAgentService

# In-memory SQLite for test execution
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def create_sample_customer(db):
    cust = Customer(
        customer_ref="CUS_TEST_01",
        name="Test Corp",
        email="test@corp.in",
        payment_method_masked="•••• 1234",
        payment_method_type="CARD",
        lifetime_value=50000.0,
        successful_transactions=5,
        failed_transactions=1,
        health_score=90
    )
    db.add(cust)
    db.commit()
    return cust

def test_guardrail_blocks_exceeded_retries(db):
    cust = create_sample_customer(db)
    payment = Payment(
        payment_ref="PAY_TEST_01",
        customer_id=cust.id,
        amount=12500.0,
        currency="INR",
        status="IN_RECOVERY",
        failure_category="TEMPORARY_DECLINE",
        risk_level="LOW",
        recovery_probability=0.8
    )
    db.add(payment)
    db.flush()

    workflow = RecoveryWorkflow(
        workflow_ref="RV-TEST01",
        payment_id=payment.id,
        trigger_reason="Test decline",
        strategy="DELAYED_RETRY",
        current_step="EXECUTING",
        attempts=2, # Max reached
        max_attempts=2,
        status="ACTIVE"
    )
    db.add(workflow)
    db.commit()

    is_permitted, status, reason = GuardrailEngine.evaluate_proposed_action(payment, workflow, "DELAYED_RETRY")
    assert is_permitted is False
    assert status == "BLOCKED_MAX_RETRIES_EXCEEDED"

def test_guardrail_escalates_high_value_transaction(db):
    cust = create_sample_customer(db)
    payment = Payment(
        payment_ref="PAY_TEST_HIGH",
        customer_id=cust.id,
        amount=125000.0, # Exceeds 50,000 INR
        currency="INR",
        status="FAILED",
        failure_category="SUBSCRIPTION_DECLINE",
        risk_level="HIGH",
        recovery_probability=0.9
    )
    db.add(payment)
    db.commit()

    is_permitted, status, reason = GuardrailEngine.evaluate_proposed_action(payment, None, "DELAYED_RETRY")
    assert is_permitted is True
    assert status == "ESCALATED_HIGH_VALUE"

def test_duplicate_recovery_blocked(db):
    cust = create_sample_customer(db)
    payment = Payment(
        payment_ref="PAY_TEST_ALREADY_RECOVERED",
        customer_id=cust.id,
        amount=24900.0,
        currency="INR",
        status="RECOVERED", # Already recovered
        failure_category="TEMPORARY_DECLINE",
        risk_level="LOW",
        recovery_probability=0.95
    )
    db.add(payment)
    db.commit()

    is_permitted, status, reason = GuardrailEngine.evaluate_proposed_action(payment, None, "DELAYED_RETRY")
    assert is_permitted is False
    assert status == "BLOCKED_PAYMENT_ALREADY_RECOVERED"

@pytest.mark.asyncio
async def test_full_recovery_and_auto_termination_loop(db):
    cust = create_sample_customer(db)
    payment = Payment(
        payment_ref="PAY_TEST_LOOP",
        customer_id=cust.id,
        amount=24500.0,
        currency="INR",
        status="FAILED",
        failure_category="TEMPORARY_DECLINE",
        risk_level="MEDIUM",
        recovery_probability=0.85
    )
    db.add(payment)
    db.commit()

    # Process failure with AI and execute
    wf = await RevenueRecoveryEngine.process_failed_payment(db, payment, auto_execute_if_safe=True)
    assert wf.status == "ACTIVE"
    assert payment.status == "IN_RECOVERY"
    assert wf.attempts == 1

    # Simulate payment resolution
    resolved = RevenueRecoveryEngine.resolve_payment_success(db, payment)
    assert resolved.status == "RECOVERED"
    assert wf.status == "RESOLVED"
    assert wf.current_step == "PAYMENT_SETTLED"

    # Verify audit entries exist
    audits = db.query(AuditLog).filter(AuditLog.payment_ref == payment.payment_ref).all()
    assert len(audits) >= 2

@pytest.mark.asyncio
async def test_high_value_human_approval_workflow(db):
    cust = create_sample_customer(db)
    payment = Payment(
        payment_ref="PAY_TEST_APPROVAL",
        customer_id=cust.id,
        amount=125000.0, # Exceeds 50,000 INR
        currency="INR",
        status="FAILED",
        failure_category="SUBSCRIPTION_DECLINE",
        risk_level="HIGH",
        recovery_probability=0.91
    )
    db.add(payment)
    db.commit()

    # Process failure
    wf = await RevenueRecoveryEngine.process_failed_payment(db, payment, auto_execute_if_safe=True)
    assert wf.status == "PENDING_APPROVAL"
    assert payment.status == "REQUIRES_APPROVAL"

    # Verify Approval Request exists
    approval = db.query(ApprovalRequest).filter(ApprovalRequest.payment_id == payment.id).first()
    assert approval is not None
    assert approval.status == "PENDING"

    # Human Approves
    updated_approval = RevenueRecoveryEngine.handle_approval_decision(
        db, approval.id, decision="APPROVE", operator_notes="Authorized by Risk Lead"
    )
    assert updated_approval.status == "APPROVED"
    assert wf.status == "ACTIVE"
    assert wf.attempts == 1
