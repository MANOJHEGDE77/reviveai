from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ApprovalRequest
from app.schemas import ApprovalRequestOut, ApprovalDecisionRequest
from app.recovery_engine import RevenueRecoveryEngine

router = APIRouter(prefix="/approvals", tags=["Approvals"])

@router.get("", response_model=List[ApprovalRequestOut])
def list_approvals(
    status: Optional[str] = Query(None, description="PENDING, APPROVED, REJECTED"),
    db: Session = Depends(get_db)
):
    query = db.query(ApprovalRequest)
    if status:
        query = query.filter(ApprovalRequest.status == status.upper())
    return query.order_by(ApprovalRequest.created_at.desc()).all()

@router.post("/{approval_id}/decision", response_model=ApprovalRequestOut)
def decide_approval(
    approval_id: int,
    body: ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    try:
        updated = RevenueRecoveryEngine.handle_approval_decision(
            db=db,
            approval_id=approval_id,
            decision=body.decision,
            operator_notes=body.operator_notes,
            decision_by=body.decision_by or "Risk Lead (SecOps)"
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
