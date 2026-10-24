from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ApprovalRequest
from app.schemas import ApprovalRequestOut, ApprovalDecisionRequest
from app.recovery_engine import RevenueRecoveryEngine
from app.auth import require_roles, Role, Operator
from app.idempotency import IdempotencyManager

router = APIRouter(prefix="/approvals", tags=["Approvals"])

@router.get("", response_model=List[ApprovalRequestOut])
def list_approvals(
    status: Optional[str] = Query(None, description="PENDING, APPROVED, REJECTED"),
    operator: Operator = Depends(require_roles([Role.VIEWER, Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
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
    operator: Operator = Depends(require_roles([Role.RISK_LEAD, Role.ADMIN])),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """
    Submits a human approval decision for high-value revenue recovery actions.
    Enforces server-side identity: operator identity is derived from the authenticated token.
    Restricted strictly to RISK_LEAD or ADMIN roles.
    """
    # 1. Check Idempotency Lock
    if idempotency_key:
        cached = IdempotencyManager.check_or_acquire_lock(
            db, idempotency_key, f"/approvals/{approval_id}/decision", body.model_dump()
        )
        if cached:
            status_code, data = cached
            return data

    # 2. Strict decision validation
    decision_clean = body.decision.strip().upper()
    if decision_clean not in ["APPROVE", "REJECT", "APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision must be APPROVE or REJECT.")
    decision_standard = "APPROVE" if decision_clean in ["APPROVE", "APPROVED"] else "REJECT"

    # 3. Derive acting operator strictly from server-side authenticated identity
    authenticated_actor = f"{operator.name} ({operator.role.value})"

    try:
        updated = RevenueRecoveryEngine.handle_approval_decision(
            db=db,
            approval_id=approval_id,
            decision=decision_standard,
            operator_notes=body.operator_notes,
            decision_by=authenticated_actor
        )

        # 4. Record completion in idempotency ledger
        if idempotency_key:
            IdempotencyManager.record_completion(
                db, idempotency_key, 200, ApprovalRequestOut.model_validate(updated).model_dump(mode="json")
            )

        return updated
    except ValueError as e:
        if idempotency_key:
            IdempotencyManager.release_on_failure(db, idempotency_key)
        status_c = 400 if "terminal state" in str(e) else 404
        raise HTTPException(status_code=status_c, detail=str(e))
    except Exception as e:
        if idempotency_key:
            IdempotencyManager.release_on_failure(db, idempotency_key)
        raise HTTPException(status_code=500, detail=f"Approval execution error: {str(e)}")

