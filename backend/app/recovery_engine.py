import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import Customer, Payment, PaymentEvent, RecoveryWorkflow, RecoveryAction, ApprovalRequest, AuditLog
from app.schemas import AiDiagnosisResult
from app.guardrails import GuardrailEngine
from app.ai_agent import AiAgentService
from app.config import settings
from app.payment_providers import get_payment_provider, ActionExecutionState

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
        executed_by: str = "REVIVE_AI_AGENT",
        idempotency_key: Optional[str] = None
    ) -> RecoveryAction:
        """
        Executes a bounded recovery action step through the configured payment provider adapter.
        Re-evaluates deterministic guardrails immediately before dispatching the irreversible action.
        """
        payment = workflow.payment
        customer = payment.customer

        # 1. Immediate In-Transaction Guardrail Re-Evaluation
        is_permitted, guardrail_status, guardrail_reason = GuardrailEngine.evaluate_proposed_action(
            payment, workflow, workflow.strategy
        )

        # 2. Strict High-Value Approval Enforcement: Block direct execution bypass
        if payment.amount >= settings.APPROVAL_THRESHOLD_INR and workflow.status == "PENDING_APPROVAL":
            is_permitted = False
            guardrail_status = "BLOCKED_REQUIRES_HUMAN_APPROVAL"
            guardrail_reason = f"Transaction amount ₹{payment.amount:,.2f} mandates human sign-off via /approvals. Direct execution prohibited."

        if not is_permitted:
            action = RecoveryAction(
                workflow_id=workflow.id,
                action_type=str(workflow.strategy),
                executed_by=executed_by,
                status="FAILED",
                provider="GUARDRAILS",
                is_simulated=payment.is_simulated,
                execution_details=f"Guardrail rejection: {guardrail_reason}"
            )
            db.add(action)
            db.commit()
            return action

        # 3. Generate or lock Idempotency Key
        idemp_key = idempotency_key or workflow.idempotency_key or f"IDEMP_{uuid.uuid4().hex[:16]}"
        workflow.idempotency_key = idemp_key

        # 4. Dispatch through Payment Provider Adapter
        provider = get_payment_provider()
        provider_result = provider.execute_retry(
            payment_ref=payment.payment_ref,
            amount=payment.amount,
            currency=payment.currency,
            strategy=str(workflow.strategy),
            idempotency_key=idemp_key,
            customer_context={
                "customer_ref": customer.customer_ref,
                "customer_name": customer.name,
                "payment_method": customer.payment_method_type
            }
        )

        # 5. Record Bounded Attempts and Action State
        workflow.attempts += 1
        workflow.current_step = f"EXECUTING_{workflow.strategy}"
        workflow.next_action = "Awaiting bank settlement confirmation"
        workflow.is_simulated = provider_result.is_simulated

        action_status = provider_result.state.value if hasattr(provider_result.state, "value") else str(provider_result.state)

        action = RecoveryAction(
            workflow_id=workflow.id,
            action_type=str(workflow.strategy),
            executed_by=executed_by,
            status=action_status,
            provider=provider_result.provider_name,
            provider_action_ref=provider_result.provider_action_ref,
            is_simulated=provider_result.is_simulated,
            idempotency_key=idemp_key,
            execution_details=f"{provider_result.message} (Attempt {workflow.attempts}/{workflow.max_attempts})"
        )
        db.add(action)

        cls._add_event(
            db, payment, "ACTION_EXECUTED",
            f"Action {workflow.strategy} dispatched via {provider_result.provider_name} by {executed_by} (Attempt {workflow.attempts}/{workflow.max_attempts}). State: {action_status}.",
            executed_by
        )

        cls._add_audit(
            db,
            actor=executed_by,
            event_type="ACTION_EXECUTION",
            payment_ref=payment.payment_ref,
            customer_ref=customer.customer_ref,
            amount=payment.amount,
            decision=f"Executed {workflow.strategy} via {provider_result.provider_name}",
            reason=f"Attempt {workflow.attempts}/{workflow.max_attempts} within 24h recovery window. Provider Ref: {provider_result.provider_action_ref}",
            guardrail_result="PASSED",
            outcome_status="SUCCESS" if provider_result.success else "FAILED",
            details_json=json.dumps({
                "action_id": action.id,
                "workflow_ref": workflow.workflow_ref,
                "provider": provider_result.provider_name,
                "state": action_status,
                "is_simulated": provider_result.is_simulated,
                "idempotency_key": idemp_key
            })
        )

        db.commit()
        return action

    @classmethod
    def resolve_payment_success(
        cls,
        db: Session,
        payment: Payment,
        settlement_ref: Optional[str] = None,
        settlement_evidence: Optional[Any] = None
    ) -> Payment:
        """
        Verifies authoritative settlement evidence before recording revenue recovery.
        Does NOT increment recovered revenue until authoritative evidence is verified.
        """
        provider = get_payment_provider()
        if settlement_evidence and isinstance(settlement_evidence, dict):
            action_ref = settlement_ref or settlement_evidence.get("provider_payment_id") or f"act_{payment.payment_ref}"
        else:
            action_ref = settlement_ref or f"act_{payment.payment_ref}"
        
        # Verify authoritative settlement evidence
        verification = provider.verify_settlement(
            payment_ref=payment.payment_ref,
            amount=payment.amount,
            provider_action_ref=action_ref
        )

        if not verification.verified:
            cls._add_event(
                db, payment, "SETTLEMENT_VERIFICATION_FAILED",
                f"Settlement verification rejected by provider {provider.__class__.__name__}.",
                "SYSTEM"
            )
            return payment

        # Authoritative settlement verified
        payment.status = "RECOVERED"
        payment.recovered_at = verification.settled_at
        payment.is_simulated = verification.is_simulated
        payment.settlement_evidence = verification.evidence_trail
        payment.customer.successful_transactions += 1
        payment.customer.lifetime_value += payment.amount

        # Terminate active workflow automatically
        workflow = payment.workflow
        if workflow and workflow.status in ["ACTIVE", "WAITING", "PENDING_APPROVAL"]:
            workflow.status = "RESOLVED"
            workflow.current_step = "PAYMENT_SETTLED"
            workflow.next_action = "None (Workflow Completed)"
            workflow.result_message = f"Successfully recovered ₹{payment.amount:,.2f} via {workflow.strategy}. Verified by {verification.evidence_trail}."

            cls._add_event(
                db, payment, "WORKFLOW_TERMINATED",
                f"Workflow {workflow.workflow_ref} automatically terminated: Payment of ₹{payment.amount:,.2f} settled successfully.",
                "SYSTEM"
            )

        cls._add_event(
            db, payment, "PAYMENT_RETRY_SUCCESS",
            f"Payment retry settled & verified! Recovered ₹{payment.amount:,.2f}. Evidence: {verification.evidence_trail}",
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
            reason=f"Authoritatively verified through {verification.settlement_ref}. Simulated: {verification.is_simulated}.",
            guardrail_result="TERMINATED_ON_SUCCESS",
            outcome_status="SUCCESS",
            details_json=json.dumps({
                "amount_recovered": payment.amount,
                "settled_at": payment.recovered_at.isoformat(),
                "settlement_ref": verification.settlement_ref,
                "is_simulated": verification.is_simulated,
                "evidence": verification.evidence_trail
            })
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

        if approval.status != "PENDING":
            raise ValueError(f"ApprovalRequest {approval_id} is already in terminal state '{approval.status}' and cannot be modified.")

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
