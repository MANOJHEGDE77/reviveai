import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import RecoveryWorkflow, Payment
from app.guardrails import GuardrailEngine

logger = logging.getLogger(__name__)

class DurableRecoveryScheduler:
    """
    Durable scheduling and recovery-window expiration monitor for ReviveAI.
    Ensures exponential backoff delays and 24-hour expiration boundaries are faithfully enforced.
    """

    @classmethod
    def process_due_workflows(cls, db: Session, engine_cls=None) -> Dict[str, Any]:
        """
        Scans for workflows due for delayed execution and workflows that have expired.
        """
        now = datetime.now(timezone.utc)
        results = {
            "retries_executed": 0,
            "workflows_expired": 0,
            "workflows_checked": 0
        }

        # 1. Expire stale workflows that passed 24h deadline
        active_workflows = db.query(RecoveryWorkflow).filter(
            RecoveryWorkflow.status.in_(["ACTIVE", "WAITING", "PENDING_APPROVAL"])
        ).all()

        for wf in active_workflows:
            results["workflows_checked"] += 1
            deadline = wf.deadline_time
            if deadline and deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            
            if deadline and now > deadline:
                wf.status = "EXPIRED"
                wf.current_step = "WINDOW_EXPIRED"
                wf.next_action = "None (Closed)"
                wf.result_message = "24-hour bounded recovery window elapsed. Stale payment retry locked."
                if wf.payment:
                    wf.payment.status = "FAILED"
                results["workflows_expired"] += 1
                logger.info(f"Workflow {wf.workflow_ref} marked EXPIRED due to recovery window deadline.")

        db.commit()

        # 2. Check for WAITING workflows that reached their scheduled execution time
        if engine_cls:
            due_workflows = db.query(RecoveryWorkflow).filter(
                RecoveryWorkflow.status == "WAITING",
                RecoveryWorkflow.scheduled_execution_at != None,
                RecoveryWorkflow.scheduled_execution_at <= now
            ).all()

            for wf in due_workflows:
                try:
                    wf.status = "ACTIVE"
                    engine_cls.execute_workflow_step(db, wf, executed_by="DURABLE_SCHEDULER")
                    results["retries_executed"] += 1
                except Exception as e:
                    logger.error(f"Failed executing scheduled workflow {wf.workflow_ref}: {e}")

        return results

    @classmethod
    def process_all(cls, db: Session) -> Dict[str, Any]:
        """Convenience method running full expiration and retry checks."""
        from app.recovery_engine import RevenueRecoveryEngine
        raw = cls.process_due_workflows(db, engine_cls=RevenueRecoveryEngine)
        return {
            "expired_windows": raw["workflows_expired"],
            "scheduled_retries_executed": raw["retries_executed"],
            "total_checked": raw["workflows_checked"]
        }
