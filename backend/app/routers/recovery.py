from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import RecoveryWorkflow, RecoveryAction
from app.schemas import RecoveryWorkflowOut, RecoveryActionOut
from app.recovery_engine import RevenueRecoveryEngine
from app.auth import require_roles, Role, Operator
from app.idempotency import IdempotencyManager
from app.scheduler import DurableRecoveryScheduler

router = APIRouter(prefix="/recovery", tags=["Recovery"])

@router.get("", response_model=List[RecoveryWorkflowOut])
@router.get("/workflows", response_model=List[RecoveryWorkflowOut])
def list_recovery_workflows(
    status: Optional[str] = Query(None, description="ACTIVE, WAITING, PENDING_APPROVAL, RESOLVED, EXPIRED"),
    operator: Operator = Depends(require_roles([Role.VIEWER, Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(RecoveryWorkflow)
    if status:
        query = query.filter(RecoveryWorkflow.status == status.upper())
    return query.order_by(RecoveryWorkflow.created_at.desc()).all()

@router.get("/{workflow_id}", response_model=RecoveryWorkflowOut)
def get_workflow_detail(
    workflow_id: int,
    operator: Operator = Depends(require_roles([Role.VIEWER, Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
    db: Session = Depends(get_db)
):
    workflow = db.query(RecoveryWorkflow).filter(RecoveryWorkflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.post("/{workflow_id}/execute", response_model=RecoveryActionOut)
def execute_workflow_action(
    workflow_id: int,
    operator: Operator = Depends(require_roles([Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """
    Executes a bounded recovery action.
    Enforces RBAC: Only OPERATOR, RISK_LEAD, or ADMIN can execute actions.
    Enforces server-side identity: acting operator is derived from the authenticated token.
    Enforces governance: Cannot bypass pending human approvals.
    """
    workflow = db.query(RecoveryWorkflow).filter(RecoveryWorkflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Anti-Bypass Guard: Pending high-value approvals cannot be executed directly
    if workflow.status == "PENDING_APPROVAL":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Workflow is awaiting Risk Lead approval via /approvals. Direct execution is prohibited."
        )

    # Idempotency Lock
    if idempotency_key:
        cached = IdempotencyManager.check_or_acquire_lock(
            db, idempotency_key, f"/recovery/{workflow_id}/execute"
        )
        if cached:
            status_code, data = cached
            return data

    authenticated_actor = f"{operator.name} ({operator.role.value})"

    try:
        action = RevenueRecoveryEngine.execute_workflow_step(
            db=db,
            workflow=workflow,
            executed_by=authenticated_actor,
            idempotency_key=idempotency_key
        )

        if idempotency_key:
            IdempotencyManager.record_completion(
                db, idempotency_key, 200, RecoveryActionOut.model_validate(action).model_dump(mode="json")
            )

        return action
    except Exception as e:
        if idempotency_key:
            IdempotencyManager.release_on_failure(db, idempotency_key)
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

@router.post("/process-scheduled")
def trigger_durable_scheduler(
    operator: Operator = Depends(require_roles([Role.OPERATOR, Role.RISK_LEAD, Role.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Durable scheduler sweep: checks for due exponential backoff retries and expires 24h stale workflows.
    """
    results = DurableRecoveryScheduler.process_due_workflows(db, engine_cls=RevenueRecoveryEngine)
    return {
        "status": "COMPLETED",
        "scheduler_results": results,
        "operator": operator.email
    }

