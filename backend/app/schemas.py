from enum import Enum
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Strict Pydantic Enums ---
class RecoveryStrategyEnum(str, Enum):
    DELAYED_RETRY = "DELAYED_RETRY"
    SMART_ROUTING = "SMART_ROUTING"
    DISCOUNTED_CHECKOUT_REENGAGEMENT = "DISCOUNTED_CHECKOUT_REENGAGEMENT"
    UPI_INTENT_SWITCH = "UPI_INTENT_SWITCH"
    CARD_EXPIRY_NOTIFICATION = "CARD_EXPIRY_NOTIFICATION"

class RiskLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class FailureCategoryEnum(str, Enum):
    TEMPORARY_DECLINE = "TEMPORARY_DECLINE"
    CHECKOUT_ABANDONED = "CHECKOUT_ABANDONED"
    SUBSCRIPTION_DECLINE = "SUBSCRIPTION_DECLINE"
    OVERDUE_INVOICE = "OVERDUE_INVOICE"
    REPEAT_DECLINE = "REPEAT_DECLINE"
    NETWORK_TIMEOUT = "NETWORK_TIMEOUT"

class DiagnosisSourceEnum(str, Enum):
    GEMINI_1_5_FLASH = "GEMINI_1_5_FLASH"
    DETERMINISTIC_HEURISTIC = "DETERMINISTIC_HEURISTIC"

# --- AI Diagnosis & Strategy Schema (Structured Output) ---
class AiDiagnosisResult(BaseModel):
    diagnosis: str = Field(..., min_length=5, description="Root cause diagnosis of the payment or revenue failure")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    risk_level: RiskLevelEnum = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    recommended_action: RecoveryStrategyEnum = Field(..., description="Calibrated recovery strategy")
    retry_after_minutes: int = Field(default=120, ge=1, le=1440, description="Optimal cooldown in minutes before executing retry")
    max_attempts: int = Field(default=2, ge=1, le=2, description="Bounded retry limit (strictly <= 2)")
    requires_approval: bool = Field(default=False, description="Whether high value requires human sign-off")
    reason: str = Field(..., min_length=5, description="Explainable rationale citing empirical customer history and cohort data")
    evidence_success_count: int = Field(default=4, ge=0, description="Customer past successful payment count")
    evidence_clv: float = Field(default=18400.0, ge=0.0, description="Customer lifetime value")
    evidence_historical_prob: float = Field(default=0.78, ge=0.0, le=1.0, description="Historical cohort recovery probability")
    diagnosis_source: DiagnosisSourceEnum = Field(default=DiagnosisSourceEnum.DETERMINISTIC_HEURISTIC, description="Source of reasoning")
    stop_conditions: List[str] = Field(default_factory=lambda: ["PAYMENT_SUCCESS", "MAX_ATTEMPTS_REACHED", "CUSTOMER_OPT_OUT", "DUPLICATE_ACTION"])

# --- Customer Schemas ---
class CustomerOut(BaseModel):
    id: int
    customer_ref: str
    name: str
    email: str
    phone: Optional[str] = None
    payment_method_masked: str
    payment_method_type: str
    lifetime_value: float
    successful_transactions: int
    failed_transactions: int
    health_score: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Payment & Incident Schemas ---
class PaymentEventOut(BaseModel):
    id: int
    event_type: str
    description: str
    actor: str
    payload_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RecoveryActionOut(BaseModel):
    id: int
    action_type: str
    executed_by: str
    status: str
    provider: Optional[str] = "SIMULATION"
    provider_action_ref: Optional[str] = None
    is_simulated: bool = True
    idempotency_key: Optional[str] = None
    execution_details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RecoveryWorkflowOut(BaseModel):
    id: int
    workflow_ref: str
    payment_id: int
    trigger_reason: str
    diagnosis: Optional[str] = None
    strategy: str
    current_step: str
    next_action: Optional[str] = None
    attempts: int
    max_attempts: int
    deadline_time: Optional[datetime] = None
    scheduled_execution_at: Optional[datetime] = None
    is_simulated: bool = True
    idempotency_key: Optional[str] = None
    status: str
    result_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    actions: List[RecoveryActionOut] = []

    model_config = ConfigDict(from_attributes=True)

class PaymentOut(BaseModel):
    id: int
    payment_ref: str
    customer_id: int
    amount: float
    currency: str
    status: str
    failure_category: str
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    risk_level: str
    recovery_probability: float
    ai_recommendation: Optional[str] = None
    ai_diagnosis_summary: Optional[str] = None
    ai_confidence: Optional[int] = None
    diagnosis_source: Optional[str] = "DETERMINISTIC_HEURISTIC"
    is_simulated: bool = True
    settlement_evidence: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    recovered_at: Optional[datetime] = None
    customer: Optional[CustomerOut] = None
    workflow: Optional[RecoveryWorkflowOut] = None

    model_config = ConfigDict(from_attributes=True)

class PaymentDetailOut(PaymentOut):
    events: List[PaymentEventOut] = []

# --- Approval Schemas ---
class ApprovalRequestOut(BaseModel):
    id: int
    approval_ref: str
    payment_id: int
    workflow_id: int
    amount: float
    customer_name: str
    risk_level: str
    ai_recommendation: str
    ai_confidence: int
    evidence_reason: Optional[str] = None
    status: str
    decision_by: Optional[str] = None
    decision_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    payment: Optional[PaymentOut] = None

    model_config = ConfigDict(from_attributes=True)

class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVE or REJECT")
    operator_notes: Optional[str] = None
    decision_by: Optional[str] = None

# --- Audit Schemas ---
class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    actor: str
    event_type: str
    payment_ref: Optional[str] = None
    customer_ref: Optional[str] = None
    amount: Optional[float] = None
    decision: str
    reason: Optional[str] = None
    guardrail_result: Optional[str] = None
    outcome_status: str
    details_json: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard & Analytics Schemas ---
class RevenueRiskCategory(BaseModel):
    category_key: str
    label: str
    amount: float
    affected_customers: int
    recovery_probability: float
    trend: str
    status: str

class LiveAiOperation(BaseModel):
    id: str
    stage: str # DETECTING, INVESTIGATING, DECIDING, EXECUTING, MONITORING, RESOLVED
    message: str
    sub_message: Optional[str] = None
    timestamp: datetime
    severity: str # info, success, warning, danger

class RevenueChartPoint(BaseModel):
    date: str
    at_risk: float
    recovered: float
    failed_count: int
    recovered_count: int

class DashboardSummaryOut(BaseModel):
    revenue_at_risk: float
    estimated_recoverable: float
    successfully_recovered: float
    recovery_rate: float
    active_workflows_count: int
    pending_approvals_count: int
    failed_incidents_count: int
    recovered_incidents_count: int
    live_recovered_revenue: float = 0.0
    simulated_recovered_revenue: float = 0.0
    live_incidents_count: int = 0
    simulated_incidents_count: int = 0
    is_demo_mode: bool = True
    risk_categories: List[RevenueRiskCategory]
    revenue_trend: List[RevenueChartPoint]
    live_operations: List[LiveAiOperation]

# --- Simulation & Incident Ingestion Schemas ---
class SimulateEventRequest(BaseModel):
    customer_name: Optional[str] = "Swiggy Merchant Partner"
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_ltv: Optional[float] = None
    customer_successful_txns: Optional[int] = None
    amount: float = Field(..., gt=0.0)
    failure_category: Optional[str] = Field("TEMPORARY_DECLINE", description="TEMPORARY_DECLINE, CHECKOUT_ABANDONED, SUBSCRIPTION_DECLINE, OVERDUE_INVOICE, REPEAT_DECLINE, NETWORK_TIMEOUT")
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    payment_method_type: Optional[str] = "CARD"
    payment_method_masked: Optional[str] = None
    auto_execute: bool = True

class CreateIncidentRequest(SimulateEventRequest):
    pass

