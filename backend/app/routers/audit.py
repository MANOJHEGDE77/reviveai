from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    actor: Optional[str] = Query(None, description="REVIVE_AI_AGENT, SYSTEM, HUMAN_OPERATOR, RAZORPAY_GATEWAY"),
    event_type: Optional[str] = Query(None, description="DIAGNOSIS, STRATEGY_SELECTION, ACTION_EXECUTION, GUARDRAIL_CHECK, APPROVAL_DECISION, PAYMENT_RECOVERY"),
    search: Optional[str] = Query(None, description="Search in decision, reason, payment_ref, or customer_ref"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if actor:
        query = query.filter(AuditLog.actor == actor)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (AuditLog.decision.ilike(search_term)) |
            (AuditLog.reason.ilike(search_term)) |
            (AuditLog.payment_ref.ilike(search_term)) |
            (AuditLog.customer_ref.ilike(search_term))
        )

    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
