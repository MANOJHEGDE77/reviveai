import random
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, Base, engine
from app.models import Customer, Payment, PaymentEvent, RecoveryWorkflow, RecoveryAction, ApprovalRequest, AuditLog
from app.schemas import SimulateEventRequest, PaymentDetailOut
from app.recovery_engine import RevenueRecoveryEngine
from app.seeder import seed_demo_data

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/trigger", response_model=PaymentDetailOut)
async def trigger_simulated_payment_event(
    body: SimulateEventRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates an incoming payment failure event into ReviveAI.
    Automatically enters the agent loop: Detect -> Understand -> Decide -> Act.
    """
    # 1. Fetch or create customer using real user-supplied fields if provided
    customer = None
    if body.customer_email:
        customer = db.query(Customer).filter(Customer.email == body.customer_email.strip()).first()
    if not customer and body.customer_name:
        customer = db.query(Customer).filter(Customer.name.ilike(f"%{body.customer_name.strip()}%")).first()

    if not customer:
        customer_ref = f"CUS_{random.randint(10000, 99999)}"
        email = body.customer_email or f"{body.customer_name.lower().replace(' ', '')}@merchant.in" if body.customer_name else "finance@merchantcorp.in"
        phone = body.customer_phone or "+91 98980 11223"
        masked = body.payment_method_masked or ("•••• " + str(random.randint(1000, 9999)))
        ltv = body.customer_ltv if (body.customer_ltv is not None and body.customer_ltv > 0) else (body.amount * 4)
        success_txns = body.customer_successful_txns if (body.customer_successful_txns is not None and body.customer_successful_txns >= 0) else random.randint(3, 15)

        customer = Customer(
            customer_ref=customer_ref,
            name=body.customer_name or "BharatPay Merchant Enterprise",
            email=email,
            phone=phone,
            payment_method_masked=masked,
            payment_method_type=body.payment_method_type or "CARD",
            lifetime_value=ltv,
            successful_transactions=success_txns,
            failed_transactions=1,
            health_score=88
        )
        db.add(customer)
        db.flush()
    else:
        # Update existing customer with any new user inputs if supplied
        if body.customer_ltv is not None and body.customer_ltv > 0:
            customer.lifetime_value = body.customer_ltv
        if body.customer_successful_txns is not None:
            customer.successful_transactions = body.customer_successful_txns
        if body.payment_method_type:
            customer.payment_method_type = body.payment_method_type
        db.flush()

    # 2. Create failed payment record with custom user data
    payment_ref = f"PAY_{random.randint(10000, 99999)}"
    risk_level = "CRITICAL" if body.amount >= 100000 else ("HIGH" if body.amount >= 50000 else "MEDIUM")

    failure_reasons_map = {
        "TEMPORARY_DECLINE": "Temporary bank switch decline: Issuer throttling detected during peak batch window.",
        "CHECKOUT_ABANDONED": "User verified mobile number but abandoned checkout at 3D Secure redirect page.",
        "SUBSCRIPTION_DECLINE": "Recurring mandate debit failed: Pre-debit card authorization lapse.",
        "OVERDUE_INVOICE": "Custom B2B purchase order invoice past due date by 14 days.",
        "REPEAT_DECLINE": "Consecutive card declines: Security threshold triggered by issuing bank.",
        "NETWORK_TIMEOUT": "HTTP 504 Gateway Timeout during UPI intent settlement authorization."
    }

    reason = body.failure_reason or failure_reasons_map.get(body.failure_category, "Payment gateway decline")
    code = body.failure_code or ("GATEWAY_SIM_" + body.failure_category)

    payment = Payment(
        payment_ref=payment_ref,
        customer_id=customer.id,
        amount=body.amount,
        currency="INR",
        status="FAILED",
        failure_category=body.failure_category,
        failure_code=code,
        failure_reason=reason,
        risk_level=risk_level,
        recovery_probability=0.82
    )
    db.add(payment)
    db.flush()

    # Log initial failure event
    db.add(PaymentEvent(
        payment_id=payment.id,
        event_type="PAYMENT_FAILED",
        description=f"Simulated payment of ₹{payment.amount:,.2f} failed: {reason}",
        actor="SYSTEM"
    ))
    db.commit()

    # 3. Trigger autonomous AI agent workflow
    await RevenueRecoveryEngine.process_failed_payment(
        db, payment, auto_execute_if_safe=body.auto_execute
    )

    # 4. Return complete detailed object
    events = db.query(PaymentEvent).filter(PaymentEvent.payment_id == payment.id).order_by(PaymentEvent.created_at.asc()).all()
    detail = PaymentDetailOut.model_validate(payment)
    detail.events = events
    return detail

@router.post("/resolve/{payment_id}", response_model=PaymentDetailOut)
def resolve_simulated_payment_success(
    payment_id: int,
    db: Session = Depends(get_db)
):
    """
    Simulates customer completing payment (e.g. delayed retry settling, checkout link paid).
    Verifies automatic workflow termination and revenue update.
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    resolved_payment = RevenueRecoveryEngine.resolve_payment_success(db, payment)

    events = db.query(PaymentEvent).filter(PaymentEvent.payment_id == resolved_payment.id).order_by(PaymentEvent.created_at.asc()).all()
    detail = PaymentDetailOut.model_validate(resolved_payment)
    detail.events = events
    return detail

@router.post("/demo-scenario")
async def run_guided_demo_scenario(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Executes the entire 10-step demo scenario defined in the enterprise platform specification:
    1. ₹24,900 payment fails
    2. ReviveAI detects failure
    3. AI investigates customer history & failure pattern
    4. AI diagnoses temporary decline (88% confidence)
    5. AI selects delayed retry strategy
    6. Deterministic Guardrails validate safety bounds
    7. Autonomous recovery workflow RV-xxxxx created
    8. Smart recovery retry executed
    9. Bank settlement simulated as successful
    10. Workflow auto-terminates, recovered revenue increments, audit log recorded.
    """
    # Create customer
    customer = Customer(
        customer_ref=f"CUS_{random.randint(10000, 99999)}",
        name="InstaMart Quick Commerce Partner",
        email="ops@instamart-partner.in",
        phone="+91 99201 33445",
        payment_method_masked="•••• 7719",
        payment_method_type="CARD",
        lifetime_value=98400.0,
        successful_transactions=8,
        failed_transactions=1,
        health_score=91
    )
    db.add(customer)
    db.flush()

    # Step 1: Payment Fails
    payment_amount = 24900.0
    payment = Payment(
        payment_ref=f"PAY_DEMO_{random.randint(1000, 9999)}",
        customer_id=customer.id,
        amount=payment_amount,
        currency="INR",
        status="FAILED",
        failure_category="TEMPORARY_DECLINE",
        failure_code="CARD_DECLINED_TEMP",
        failure_reason="Temporary issuer decline: HDFC switch intermittent drop.",
        risk_level="MEDIUM",
        recovery_probability=0.88
    )
    db.add(payment)
    db.flush()

    db.add(PaymentEvent(
        payment_id=payment.id,
        event_type="PAYMENT_FAILED",
        description=f"Payment of ₹{payment_amount:,.2f} declined by card network (CARD_DECLINED_TEMP).",
        actor="SYSTEM"
    ))
    db.commit()

    # Step 2-7: AI Investigation & Workflow Execution
    workflow = await RevenueRecoveryEngine.process_failed_payment(db, payment, auto_execute_if_safe=True)

    # Step 8-10: Payment Success & Auto-Termination
    resolved_payment = RevenueRecoveryEngine.resolve_payment_success(db, payment)

    return {
        "status": "COMPLETED",
        "scenario": "Autonomous Temporary Decline Recovery",
        "payment_ref": resolved_payment.payment_ref,
        "amount_recovered": resolved_payment.amount,
        "customer": customer.name,
        "workflow_ref": workflow.workflow_ref,
        "ai_confidence": resolved_payment.ai_confidence,
        "steps_completed": [
            "1. Payment failure detected (₹24,900.00)",
            "2. ReviveAI collected customer history (8 past successes, ₹98.4K CLV)",
            "3. AI diagnosed root cause: Temporary issuer decline (88% confidence)",
            "4. Strategy selected: DELAYED_RETRY (cooldown: 120m, max attempts: 2)",
            "5. Guardrails passed: Attempts < 2, Amount < ₹50,000 threshold",
            f"6. Autonomous workflow {workflow.workflow_ref} created and action dispatched",
            "7. Bank retry simulated: 3DS verified and settled",
            "8. Workflow auto-terminated with status RESOLVED",
            "9. Revenue at Risk decremented, Successfully Recovered incremented",
            "10. Immutable decision trail logged in Audit Ledger"
        ]
    }

@router.post("/reset")
def reset_demo_database(db: Session = Depends(get_db)):
    """
    Clears the database and reseeds with realistic Indian fintech test data.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_demo_data(db)
    return {"message": "ReviveAI database reset and seeded successfully."}
