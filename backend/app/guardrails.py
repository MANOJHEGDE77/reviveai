from datetime import datetime, timezone
from typing import Tuple, Optional
from app.config import settings
from app.models import Payment, RecoveryWorkflow

class GuardrailEngine:
    """
    Deterministic Financial Safety Guardrails for ReviveAI.
    Protects merchant reputation, customer trust, and financial ledger safety.
    Hard business invariants evaluated before ANY autonomous action is dispatched.
    """

    @classmethod
    def evaluate_proposed_action(
        cls,
        payment: Payment,
        workflow: Optional[RecoveryWorkflow],
        action_type: str
    ) -> Tuple[bool, str, str]:
        """
        Evaluates proposed action against deterministic guardrails:
        1. High-Value Escalation (Amount >= APPROVAL_THRESHOLD_INR -> Escalates to Human)
        2. Attempt Limit (Workflow attempts >= MAX_RETRIES -> Blocked)
        3. Time-to-Recovery (Deadline expired -> Blocked)
        4. Auto-Termination (Payment already settled -> Blocked)
        
        Returns: (is_permitted, status_code, reason_explanation)
        """
        # Rule 0: Auto-Termination check - never retry settled payments or terminal workflows
        if payment.status == "RECOVERED":
            return (
                False,
                "BLOCKED_PAYMENT_ALREADY_RECOVERED",
                f"Payment {payment.payment_ref} has already been settled and recovered. Subsequent recovery attempts strictly prohibited."
            )

        if workflow and workflow.status in ["RESOLVED", "EXPIRED", "REJECTED"]:
            return (
                False,
                f"BLOCKED_WORKFLOW_{workflow.status}",
                f"Workflow {workflow.workflow_ref} is in terminal state '{workflow.status}'. Further action execution is prohibited."
            )

        # Rule 1: Strict Autonomous Retry Bound (<= 2 attempts) - applies to all workflows
        if workflow and workflow.attempts >= settings.MAX_RETRIES:
            return (
                False,
                "BLOCKED_MAX_RETRIES_EXCEEDED",
                f"Workflow {workflow.workflow_ref} has reached maximum autonomous attempt ceiling ({settings.MAX_RETRIES} attempts). Action blocked to prevent cardholder spamming."
            )

        # Rule 2: Recovery Window Deadline (24-Hour Bounded Action Window) - applies to all workflows
        if workflow:
            now_utc = datetime.now(timezone.utc)
            deadline = workflow.deadline_time
            if deadline and deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            if deadline and now_utc > deadline:
                return (
                    False,
                    "BLOCKED_RECOVERY_WINDOW_EXPIRED",
                    f"Workflow {workflow.workflow_ref} exceeded 24-hour recovery window. Stale payment retry locked."
                )

        # Rule 3: High-Value Governance Threshold (Escalation to Human Operator)
        # Transactions >= INR 50,000 mandate human sign-off unless workflow has already been approved
        if payment.amount >= settings.APPROVAL_THRESHOLD_INR and (not workflow or workflow.status != "ACTIVE"):
            return (
                True, # Permitted to initiate approval workflow
                "ESCALATED_HIGH_VALUE",
                f"Transaction amount ₹{payment.amount:,.2f} meets or exceeds governance threshold (₹{settings.APPROVAL_THRESHOLD_INR:,.2f}). Human sign-off mandated via /approvals."
            )

        # Rule 4: Action Rate-Limiting & Duplicate Outreach Guard
        if action_type == "RECOVERY_SMS_EMAIL" and workflow and workflow.attempts >= 1:
            return (
                False,
                "BLOCKED_NOTIFICATION_RATE_LIMIT",
                "Customer outreach notification already dispatched for this incident. Suppressing duplicate notifications."
            )

        # All deterministic guardrails passed
        return (
            True,
            "PASSED_ALL_GUARDRAILS",
            f"Action '{action_type}' cleared all deterministic safety bounds. Bounded retry budget: {workflow.attempts if workflow else 0}/{settings.MAX_RETRIES}."
        )

    @classmethod
    def can_auto_execute(cls, payment: Payment, workflow: Optional[RecoveryWorkflow]) -> bool:
        """
        Helper for autonomous loop: determines whether an action can execute immediately without human pause.
        """
        if payment.amount >= settings.APPROVAL_THRESHOLD_INR:
            return False
        if workflow and workflow.attempts >= settings.MAX_RETRIES:
            return False
        if payment.status == "RECOVERED":
            return False
        if workflow and workflow.status in ["RESOLVED", "EXPIRED", "REJECTED"]:
            return False
        if workflow:
            now_utc = datetime.now(timezone.utc)
            deadline = workflow.deadline_time
            if deadline and deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            if deadline and now_utc > deadline:
                return False
        return True

    @staticmethod
    def should_terminate_workflow(payment: Payment, workflow: RecoveryWorkflow) -> Tuple[bool, str]:
        """
        Determines whether an active workflow must be automatically terminated.
        """
        if payment.status == "RECOVERED":
            return True, "Payment successfully recovered and verified."
        if workflow.attempts >= workflow.max_attempts:
            return True, f"Max attempts ({workflow.max_attempts}) reached without recovery."
        if workflow.deadline_time and datetime.utcnow() > workflow.deadline_time:
            return True, "24-hour bounded recovery window elapsed."
        return False, ""
