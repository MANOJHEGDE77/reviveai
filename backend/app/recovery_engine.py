import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import Customer, Payment, PaymentEvent, RecoveryWorkflow, RecoveryAction, ApprovalRequest, AuditLog
from app.schemas import AiDiagnosisResult
from app.guardrails import GuardrailEngine
from app.ai_agent import AiAgentService

class RevenueRecoveryEngine:
    """
    Core closed-loop orchestrator for ReviveAI:
    DETECT -> UNDERSTAND -> DECIDE -> ACT -> VERIFY -> LEARN
    """

    @classmethod
    async def process_failed_payment(
        cls,
        db: Session,
        payment: Payment,
        auto_execute_if_safe: bool = True
    ) -> RecoveryWorkflow:
        """
        Ingests a failed payment, performs AI diagnosis, evaluates guardrails,
        and constructs/updates a bounded RecoveryWorkflow.
        """
        customer = payment.customer

        # 1. Event: AI Investigation Started
        cls._add_event(
            db, payment, "AI_INVESTIGATION_STARTED",
            f"Autonomous AI agent initiated forensic analysis for decline code {payment.failure_code or payment.failure_category}.",
            "REVIVE_AI_AGENT"
        )

        # 2. AI Reasoning: Collect context and diagnose root cause
        diagnosis_result = await AiAgentService.diagnose_and_decide(payment, customer)

        # 3. Update payment record with AI structured insight
        payment.ai_recommendation = diagnosis_result.recommended_action
        payment.ai_diagnosis_summary = diagnosis_result.diagnosis
        payment.ai_confidence = int(diagnosis_result.confidence * 100) if diagnosis_result.confidence <= 1.0 else int(diagnosis_result.confidence)
        payment.recovery_probability = diagnosis_result.confidence if diagnosis_result.confidence <= 1.0 else (diagnosis_result.confidence / 100.0)

        cls._add_event(
            db, payment, "DIAGNOSIS_COMPLETED",
            f"Diagnosis: {diagnosis_result.diagnosis} (Confidence: {payment.ai_confidence}%, Strategy: {diagnosis_result.recommended_action}).",
            "REVIVE_AI_AGENT",
            payload_json=diagnosis_result.model_dump_json()
        )

        # 4. Evaluate proposed action against deterministic guardrails
        workflow = payment.workflow
        is_permitted, guardrail_status, guardrail_reason = GuardrailEngine.evaluate_proposed_action(
            payment=payment,
            workflow=workflow,
            action_type=diagnosis_result.recommended_action
        )

        cls._add_event(
            db, payment, "GUARDRAIL_VALIDATED",
            f"Guardrail check result: {guardrail_status} — {guardrail_reason}",
            "SYSTEM",
            payload_json=json.dumps({"guardrail_status": guardrail_status, "reason": guardrail_reason})
        )

        # Audit Log Entry for Diagnosis & Strategy
        cls._add_audit(
            db,
            actor="REVIVE_AI_AGENT",
            event_type="DIAGNOSIS",
            payment_ref=payment.payment_ref,
            customer_ref=customer.customer_ref,
            amount=payment.amount,
            decision=f"Strategy: {diagnosis_result.recommended_action}",
            reason=diagnosis_result.reason,
            guardrail_result=guardrail_status,
            outcome_status="SCHEDULED" if is_permitted else "BLOCKED",
            details_json=diagnosis_result.model_dump_json()
        )

        # 5. Construct or update RecoveryWorkflow
        if not workflow:
            workflow_ref = f"RV-{payment.id + 1000:05d}"
            workflow = RecoveryWorkflow(
                workflow_ref=workflow_ref,
                payment_id=payment.id,
                trigger_reason=f"Payment failed: {payment.failure_category}",
                diagnosis=diagnosis_result.diagnosis,
                strategy=diagnosis_result.recommended_action,
                current_step="ANALYSIS_COMPLETED",
                next_action=f"Execute {diagnosis_result.recommended_action} in {diagnosis_result.retry_after_minutes}m",
                attempts=0,
                max_attempts=min(diagnosis_result.max_attempts, 2),
                deadline_time=datetime.now(timezone.utc) + timedelta(hours=24),
                status="WAITING"
            )
            db.add(workflow)
            db.flush()

        # Handle High-Value Human Approval Escalation
        if guardrail_status == "ESCALATED_HIGH_VALUE" or diagnosis_result.requires_approval:
            workflow.status = "PENDING_APPROVAL"
            workflow.current_step = "PENDING_HUMAN_APPROVAL"
            workflow.next_action = "Awaiting Risk Lead sign-off"
            payment.status = "REQUIRES_APPROVAL"

            # Create Approval Request if not already exists
            existing_approval = db.query(ApprovalRequest).filter(ApprovalRequest.workflow_id == workflow.id).first()
            if not existing_approval:
                approval_ref = f"APP-{workflow.id + 4000:04d}"
                approval = ApprovalRequest(
                    approval_ref=approval_ref,
                    payment_id=payment.id,
                    workflow_id=workflow.id,
                    amount=payment.amount,
                    customer_name=customer.name,
                    risk_level=diagnosis_result.risk_level,
                    ai_recommendation=f"{diagnosis_result.recommended_action} (Retry in {diagnosis_result.retry_after_minutes}m)",
                    ai_confidence=payment.ai_confidence,
                    evidence_reason=diagnosis_result.reason,
                    status="PENDING"
                )
                db.add(approval)

            cls._add_event(
                db, payment, "APPROVAL_REQUESTED",
                f"High-value recovery (₹{payment.amount:,.2f}) escalated to Human Approval Console.",
                "REVIVE_AI_AGENT"
            )
            db.commit()
            return workflow

        # Safe for Autonomous Execution
        payment.status = "IN_RECOVERY"
        workflow.status = "ACTIVE"
        workflow.current_step = f"READY_FOR_{diagnosis_result.recommended_action}"

        if auto_execute_if_safe:
            cls.execute_workflow_step(db, workflow, executed_by="REVIVE_AI_AGENT")

        db.commit()
        return workflow

    @classmethod
    def execute_workflow_step(
        cls,
        db: Session,
        workflow: RecoveryWorkflow,
        executed_by: str = "REVIVE_AI_AGENT"
    ) -> RecoveryAction:
        """
        Executes a bounded recovery action step.
        """
        payment = workflow.payment
        customer = payment.customer

        # Validate Guardrails prior to execution
        is_permitted, guardrail_status, guardrail_reason = GuardrailEngine.evaluate_proposed_action(
            payment, workflow, workflow.strategy
        )

        if not is_permitted:
            action = RecoveryAction(
                workflow_id=workflow.id,
                action_type=workflow.strategy,
                executed_by=executed_by,
                status="FAILED",
                execution_details=f"Guardrail rejection: {guardrail_reason}"
            )
            db.add(action)
            db.commit()
            return action

        # Increment bounded attempts
        workflow.attempts += 1
        workflow.current_step = f"EXECUTING_{workflow.strategy}"
        workflow.next_action = "Awaiting bank settlement confirmation"

        action = RecoveryAction(
            workflow_id=workflow.id,
            action_type=workflow.strategy,
            executed_by=executed_by,
            status="EXECUTED",
            execution_details=f"Dispatched {workflow.strategy} through smart routing network. Attempt {workflow.attempts}/{workflow.max_attempts}."
        )
        db.add(action)

        cls._add_event(
            db, payment, "ACTION_EXECUTED",
            f"Action {workflow.strategy} executed by {executed_by} (Attempt {workflow.attempts}/{workflow.max_attempts}).",
            executed_by
        )

        cls._add_audit(
            db,
            actor=executed_by,
            event_type="ACTION_EXECUTION",
            payment_ref=payment.payment_ref,
            customer_ref=customer.customer_ref,
            amount=payment.amount,
            decision=f"Executed {workflow.strategy}",
            reason=f"Attempt {workflow.attempts}/{workflow.max_attempts} within 24h recovery window",
            guardrail_result="PASSED",
            outcome_status="SUCCESS",
            details_json=json.dumps({"action_id": action.id, "workflow_ref": workflow.workflow_ref})
        )

        db.commit()
        return action

    @classmethod
    def resolve_payment_success(
        cls,
        db: Session,
        payment: Payment,
        settlement_ref: Optional[str] = None
    ) -> Payment:
        """
        Signals that a payment retry or re-engagement succeeded.
        Triggers automatic workflow termination and updates analytics.
        """
        payment.status = "RECOVERED"
        payment.recovered_at = datetime.now(timezone.utc)
        payment.customer.successful_transactions += 1
        payment.customer.lifetime_value += payment.amount

        # Terminate active workflow automatically
        workflow = payment.workflow
        if workflow and workflow.status in ["ACTIVE", "WAITING", "PENDING_APPROVAL"]:
            workflow.status = "RESOLVED"
            workflow.current_step = "PAYMENT_SETTLED"
            workflow.next_action = "None (Workflow Completed)"
            workflow.result_message = f"Successfully recovered ₹{payment.amount:,.2f} via {workflow.strategy}."

            cls._add_event(
                db, payment, "WORKFLOW_TERMINATED",
                f"Workflow {workflow.workflow_ref} automatically terminated: Payment of ₹{payment.amount:,.2f} settled successfully.",
                "SYSTEM"
            )

        cls._add_event(
            db, payment, "PAYMENT_RETRY_SUCCESS",
            f"Payment retry succeeded! Recovered ₹{payment.amount:,.2f}. Settlement Ref: {settlement_ref or 'RAZORPAY_SIM_' + payment.payment_ref}.",
            "RAZORPAY_GATEWAY"
        )

        cls._add_audit(
            db,
            actor="SYSTEM",
            event_type="PAYMENT_RECOVERY",
            payment_ref=payment.payment_ref,
            customer_ref=payment.customer.customer_ref,
            amount=payment.amount,
            decision="Payment Successfully Recovered",
            reason=f"Settled through autonomous recovery workflow {workflow.workflow_ref if workflow else 'N/A'}",
            guardrail_result="TERMINATED_ON_SUCCESS",
            outcome_status="SUCCESS",
            details_json=json.dumps({"amount_recovered": payment.amount, "settled_at": payment.recovered_at.isoformat()})
        )

        db.commit()
        return payment

    @classmethod
    def handle_approval_decision(
        cls,
        db: Session,
        approval_id: int,
        decision: str, # APPROVE or REJECT
        operator_notes: Optional[str] = None,
        decision_by: str = "Risk Lead (SecOps)"
    ) -> ApprovalRequest:
        """
        Processes human sign-off on high-value recovery actions.
        """
        approval = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
        if not approval:
            raise ValueError(f"ApprovalRequest {approval_id} not found")

        approval.status = "APPROVED" if decision.upper() == "APPROVE" else "REJECTED"
        approval.decision_by = decision_by
        approval.decision_notes = operator_notes or f"Manual decision: {decision}"
        approval.resolved_at = datetime.now(timezone.utc)

        workflow = approval.workflow
        payment = approval.payment

        if approval.status == "APPROVED":
            workflow.status = "ACTIVE"
            workflow.current_step = "APPROVED_BY_OPERATOR"
            payment.status = "IN_RECOVERY"
            cls._add_event(
                db, payment, "ACTION_EXECUTED",
                f"Human Operator {decision_by} approved high-value recovery action ({workflow.strategy}). Notes: {approval.decision_notes}",
                decision_by
            )
            # Execute step
            cls.execute_workflow_step(db, workflow, executed_by=decision_by)
        else:
            workflow.status = "REJECTED"
            workflow.current_step = "REJECTED_BY_OPERATOR"
            workflow.result_message = f"Rejected by {decision_by}: {approval.decision_notes}"
            payment.status = "FAILED"
            cls._add_event(
                db, payment, "WORKFLOW_TERMINATED",
                f"High-value recovery rejected by {decision_by}. Workflow terminated.",
                decision_by
            )

        cls._add_audit(
            db,
            actor=decision_by,
            event_type="APPROVAL_DECISION",
            payment_ref=payment.payment_ref,
            customer_ref=payment.customer.customer_ref,
            amount=payment.amount,
            decision=f"Operator {approval.status} high-value action",
            reason=approval.decision_notes,
            guardrail_result="HUMAN_SIGN_OFF",
            outcome_status=approval.status,
            details_json=json.dumps({"approval_ref": approval.approval_ref, "notes": approval.decision_notes})
        )

        db.commit()
        return approval

    @staticmethod
    def _add_event(db: Session, payment: Payment, event_type: str, description: str, actor: str, payload_json: Optional[str] = None):
        event = PaymentEvent(
            payment_id=payment.id,
            event_type=event_type,
            description=description,
            actor=actor,
            payload_json=payload_json
        )
        db.add(event)

    @staticmethod
    def _add_audit(
        db: Session,
        actor: str,
        event_type: str,
        payment_ref: Optional[str],
        customer_ref: Optional[str],
        amount: Optional[float],
        decision: str,
        reason: Optional[str],
        guardrail_result: Optional[str],
        outcome_status: str,
        details_json: Optional[str] = None
    ):
        audit = AuditLog(
            actor=actor,
            event_type=event_type,
            payment_ref=payment_ref,
            customer_ref=customer_ref,
            amount=amount,
            decision=decision,
            reason=reason,
            guardrail_result=guardrail_result,
            outcome_status=outcome_status,
            details_json=details_json
        )
        db.add(audit)
