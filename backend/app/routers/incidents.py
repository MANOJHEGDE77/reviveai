import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Payment, PaymentEvent, Customer
from app.schemas import PaymentOut, PaymentDetailOut, PaymentEventOut, CreateIncidentRequest
from app.recovery_engine import RevenueRecoveryEngine
from app.auth import require_roles, Role, Operator
from app.idempotency import IdempotencyManager

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.post("", response_model=PaymentDetailOut)
async def create_custom_incident(
    body: CreateIncidentRequest,
    operator: Operator = Depends(require_roles([Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """
    Ingests a custom payment failure incident.
    Validates idempotency and evaluates deterministic guardrails with authenticated operator tracking.
    """
    if idempotency_key:
        cached = IdempotencyManager.check_or_acquire_lock(
            db, idempotency_key, "/incidents", body.model_dump()
        )
        if cached:
            status_code, data = cached
            return data

    customer = None
    if body.customer_email:
        customer = db.query(Customer).filter(Customer.email == body.customer_email.strip()).first()
    if not customer and body.customer_name:
        customer = db.query(Customer).filter(Customer.name.ilike(f"%{body.customer_name.strip()}%")).first()

    if not customer:
        customer_ref = f"CUS_{random.randint(10000, 99999)}"
        email = body.customer_email or (f"{body.customer_name.lower().replace(' ', '')}@merchant.in" if body.customer_name else "billing@customer.in")
        phone = body.customer_phone or "+91 98123 45678"
        masked = body.payment_method_masked or ("•••• " + str(random.randint(1000, 9999)))
        ltv = body.customer_ltv if (body.customer_ltv is not None and body.customer_ltv > 0) else (body.amount * 3.5)
        success_txns = body.customer_successful_txns if (body.customer_successful_txns is not None and body.customer_successful_txns >= 0) else 5

        customer = Customer(
            customer_ref=customer_ref,
            name=body.customer_name or "Custom Merchant Customer",
            email=email,
            phone=phone,
            payment_method_masked=masked,
            payment_method_type=body.payment_method_type or "CARD",
            lifetime_value=ltv,
            successful_transactions=success_txns,
            failed_transactions=1,
            health_score=85
        )
        db.add(customer)
        db.flush()
    else:
        if body.customer_ltv is not None and body.customer_ltv > 0:
            customer.lifetime_value = body.customer_ltv
        if body.customer_successful_txns is not None:
            customer.successful_transactions = body.customer_successful_txns
        if body.payment_method_type:
            customer.payment_method_type = body.payment_method_type
        db.flush()

    payment_ref = f"PAY_{random.randint(10000, 99999)}"
    risk_level = "CRITICAL" if body.amount >= 100000 else ("HIGH" if body.amount >= 50000 else "MEDIUM")
    reason = body.failure_reason or f"Payment decline on {body.payment_method_type or 'rail'}: {body.failure_category}"
    code = body.failure_code or f"INCIDENT_{body.failure_category}"

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
        recovery_probability=0.82,
        is_simulated=True
    )
    db.add(payment)
    db.flush()

    acting_identity = f"{operator.name} ({operator.role.value})"

    db.add(PaymentEvent(
        payment_id=payment.id,
        event_type="PAYMENT_FAILED",
        description=f"Payment failure of ₹{payment.amount:,.2f} recorded: {reason}",
        actor=acting_identity
    ))
    db.commit()

    await RevenueRecoveryEngine.process_failed_payment(
        db, payment, auto_execute_if_safe=body.auto_execute
    )

    detail = get_incident_detail(payment.id, operator, db)

    if idempotency_key:
        IdempotencyManager.record_completion(
            db, idempotency_key, 200, PaymentDetailOut.model_validate(detail).model_dump(mode="json")
        )

    return detail

@router.get("", response_model=List[PaymentOut])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status (FAILED, IN_RECOVERY, RECOVERED, REQUIRES_APPROVAL)"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    search: Optional[str] = Query(None, description="Search by customer name or payment reference"),
    operator: Operator = Depends(require_roles([Role.VIEWER, Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(Payment).join(Customer, Payment.customer_id == Customer.id)

    if status:
        query = query.filter(Payment.status == status.upper())
    if risk_level:
        query = query.filter(Payment.risk_level == risk_level.upper())
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(Payment.payment_ref).like(s)) |
            (func.lower(Customer.name).like(s)) |
            (func.lower(Payment.failure_reason).like(s)) |
            (func.lower(Payment.failure_category).like(s))
        )

    return query.order_by(Payment.created_at.desc()).all()

@router.get("/{incident_id}", response_model=PaymentDetailOut)
def get_incident_detail(
    incident_id: int,
    operator: Operator = Depends(require_roles([Role.VIEWER, Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.id == incident_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Incident not found")

    events = db.query(PaymentEvent).filter(PaymentEvent.payment_id == payment.id)\
        .order_by(PaymentEvent.created_at.asc()).all()

    detail = PaymentDetailOut.model_validate(payment)
    detail.events = [PaymentEventOut.model_validate(e) for e in events]
    return detail

@router.post("/{incident_id}/investigate", response_model=PaymentDetailOut)
@router.post("/{incident_id}/explain", response_model=PaymentDetailOut)
async def investigate_incident(
    incident_id: int,
    operator: Operator = Depends(require_roles([Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.id == incident_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Incident not found")

    if not payment.ai_recommendation:
        await RevenueRecoveryEngine.process_failed_payment(db, payment, auto_execute_if_safe=False)

    return get_incident_detail(incident_id, operator, db)
