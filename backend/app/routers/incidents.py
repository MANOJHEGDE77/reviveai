from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Payment, PaymentEvent, Customer
from app.schemas import PaymentOut, PaymentDetailOut, PaymentEventOut
from app.recovery_engine import RevenueRecoveryEngine

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[PaymentOut])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status (FAILED, IN_RECOVERY, RECOVERED, REQUIRES_APPROVAL)"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    search: Optional[str] = Query(None, description="Search by customer name or payment reference"),
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
def get_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == incident_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Incident not found")

    events = db.query(PaymentEvent).filter(PaymentEvent.payment_id == payment.id)\
        .order_by(PaymentEvent.created_at.asc()).all()

    detail = PaymentDetailOut.model_validate(payment)
    detail.events = [PaymentEventOut.model_validate(e) for e in events]
    return detail

@router.post("/{incident_id}/investigate", response_model=PaymentDetailOut)
async def investigate_incident(incident_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == incident_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Run AI Investigation & Guardrail validation
    await RevenueRecoveryEngine.process_failed_payment(db, payment, auto_execute_if_safe=False)

    return get_incident_detail(incident_id, db)
