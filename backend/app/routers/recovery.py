from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import RecoveryWorkflow, RecoveryAction
from app.schemas import RecoveryWorkflowOut, RecoveryActionOut
from app.recovery_engine import RevenueRecoveryEngine

router = APIRouter(prefix="/recovery", tags=["Recovery"])

@router.get("", response_model=List[RecoveryWorkflowOut])
@router.get("/workflows", response_model=List[RecoveryWorkflowOut])
def list_recovery_workflows(
    status: Optional[str] = Query(None, description="ACTIVE, WAITING, PENDING_APPROVAL, RESOLVED, EXPIRED"),
    db: Session = Depends(get_db)
):
    query = db.query(RecoveryWorkflow)
    if status:
        query = query.filter(RecoveryWorkflow.status == status.upper())
    return query.order_by(RecoveryWorkflow.created_at.desc()).all()

@router.get("/{workflow_id}", response_model=RecoveryWorkflowOut)
def get_workflow_detail(workflow_id: int, db: Session = Depends(get_db)):
    workflow = db.query(RecoveryWorkflow).filter(RecoveryWorkflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.post("/{workflow_id}/execute", response_model=RecoveryActionOut)
def execute_workflow_action(workflow_id: int, db: Session = Depends(get_db)):
    workflow = db.query(RecoveryWorkflow).filter(RecoveryWorkflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    action = RevenueRecoveryEngine.execute_workflow_step(db, workflow, executed_by="HUMAN_OPERATOR")
    return action
