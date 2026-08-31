from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_ref = Column(String(64), unique=True, index=True, nullable=False) # e.g. CUS_82931
    name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=True)
    payment_method_masked = Column(String(64), nullable=False) # e.g. •••• 4821
    payment_method_type = Column(String(32), nullable=False) # CARD, UPI, NETBANKING
    lifetime_value = Column(Float, nullable=False, default=0.0) # in INR
    successful_transactions = Column(Integer, nullable=False, default=0)
    failed_transactions = Column(Integer, nullable=False, default=0)
    health_score = Column(Integer, nullable=False, default=85) # 0-100
    created_at = Column(DateTime, default=utc_now, nullable=False)

    payments = relationship("Payment", back_populates="customer", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_ref = Column(String(64), unique=True, index=True, nullable=False) # e.g. PAY_88491
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False) # in INR
    currency = Column(String(8), default="INR", nullable=False)
    status = Column(String(32), index=True, nullable=False) # FAILED, IN_RECOVERY, RECOVERED, REQUIRES_APPROVAL, LOST
    failure_category = Column(String(64), index=True, nullable=False) # TEMPORARY_DECLINE, CHECKOUT_ABANDONED, SUBSCRIPTION_DECLINE, OVERDUE_INVOICE, REPEAT_DECLINE, NETWORK_TIMEOUT
    failure_code = Column(String(64), nullable=True) # e.g. ISSUER_DOWN, INSUFFICIENT_FUNDS, EXPIRED_CARD
    failure_reason = Column(String(512), nullable=True)
    risk_level = Column(String(16), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    recovery_probability = Column(Float, nullable=False, default=0.75) # 0.0 to 1.0
    ai_recommendation = Column(String(256), nullable=True)
    ai_diagnosis_summary = Column(Text, nullable=True)
    ai_confidence = Column(Integer, nullable=True) # 0-100%
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    recovered_at = Column(DateTime, nullable=True)

    customer = relationship("Customer", back_populates="payments")
    events = relationship("PaymentEvent", back_populates="payment", cascade="all, delete-orphan")
    workflow = relationship("RecoveryWorkflow", back_populates="payment", uselist=False, cascade="all, delete-orphan")
    approval_requests = relationship("ApprovalRequest", back_populates="payment", cascade="all, delete-orphan")


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False) # PAYMENT_FAILED, AI_INVESTIGATION_STARTED, DIAGNOSIS_COMPLETED, STRATEGY_DECIDED, GUARDRAIL_VALIDATED, APPROVAL_REQUESTED, ACTION_EXECUTED, PAYMENT_RETRY_SUCCESS, WORKFLOW_TERMINATED
    description = Column(String(1024), nullable=False)
    actor = Column(String(64), nullable=False) # SYSTEM, REVIVE_AI_AGENT, HUMAN_OPERATOR, RAZORPAY_GATEWAY
    payload_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    payment = relationship("Payment", back_populates="events")


class RecoveryWorkflow(Base):
    __tablename__ = "recovery_workflows"

    id = Column(Integer, primary_key=True, index=True)
    workflow_ref = Column(String(64), unique=True, index=True, nullable=False) # e.g. RV-10291
    payment_id = Column(Integer, ForeignKey("payments.id"), unique=True, nullable=False)
    trigger_reason = Column(String(256), nullable=False)
    diagnosis = Column(Text, nullable=True)
    strategy = Column(String(64), nullable=False) # DELAYED_RETRY, SMART_ROUTING, DISCOUNTED_CHECKOUT_REENGAGEMENT, UPI_INTENT_SWITCH, CARD_EXPIRY_NOTIFICATION
    current_step = Column(String(128), nullable=False)
    next_action = Column(String(128), nullable=True)
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=2, nullable=False)
    deadline_time = Column(DateTime, nullable=True)
    status = Column(String(32), index=True, nullable=False) # ACTIVE, WAITING, PENDING_APPROVAL, RESOLVED, EXPIRED, REJECTED, CANCELLED
    result_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    payment = relationship("Payment", back_populates="workflow")
    actions = relationship("RecoveryAction", back_populates="workflow", cascade="all, delete-orphan")
    approval_request = relationship("ApprovalRequest", back_populates="workflow", uselist=False, cascade="all, delete-orphan")


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("recovery_workflows.id"), nullable=False, index=True)
    action_type = Column(String(64), nullable=False) # DELAYED_RETRY, FALLBACK_GATEWAY_ROUTING, RECOVERY_SMS_EMAIL, APPROVAL_ESCALATION
    executed_by = Column(String(64), nullable=False) # REVIVE_AI_AGENT, HUMAN_OPERATOR
    status = Column(String(32), nullable=False) # SCHEDULED, EXECUTED, FAILED, CANCELLED
    execution_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    workflow = relationship("RecoveryWorkflow", back_populates="actions")


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    approval_ref = Column(String(64), unique=True, index=True, nullable=False) # e.g. APP-4019
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    workflow_id = Column(Integer, ForeignKey("recovery_workflows.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    customer_name = Column(String(128), nullable=False)
    risk_level = Column(String(16), nullable=False)
    ai_recommendation = Column(String(256), nullable=False)
    ai_confidence = Column(Integer, nullable=False)
    evidence_reason = Column(Text, nullable=True)
    status = Column(String(32), index=True, default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    decision_by = Column(String(128), nullable=True)
    decision_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    payment = relationship("Payment", back_populates="approval_requests")
    workflow = relationship("RecoveryWorkflow", back_populates="approval_request")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True, nullable=False)
    actor = Column(String(64), index=True, nullable=False) # REVIVE_AI_AGENT, SYSTEM, HUMAN_OPERATOR, RAZORPAY_GATEWAY
    event_type = Column(String(64), nullable=False) # DIAGNOSIS, STRATEGY_SELECTION, ACTION_EXECUTION, GUARDRAIL_CHECK, APPROVAL_DECISION, PAYMENT_RECOVERY, WORKFLOW_TERMINATION
    payment_ref = Column(String(64), index=True, nullable=True)
    customer_ref = Column(String(64), nullable=True)
    amount = Column(Float, nullable=True)
    decision = Column(String(256), nullable=False)
    reason = Column(Text, nullable=True)
    guardrail_result = Column(String(128), nullable=True) # PASSED, ESCALATED, BLOCKED
    outcome_status = Column(String(64), nullable=False) # SUCCESS, SCHEDULED, REJECTED, TERMINATED, FAILED
    details_json = Column(Text, nullable=True)

