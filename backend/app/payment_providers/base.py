from abc import ABC, abstractmethod
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel

class ActionExecutionState(str, Enum):
    PENDING_EXECUTION = "PENDING_EXECUTION"
    SIMULATED_EXECUTION = "SIMULATED_EXECUTION"
    PROVIDER_SUBMITTED = "PROVIDER_SUBMITTED"
    PROVIDER_CONFIRMED = "PROVIDER_CONFIRMED"
    SETTLEMENT_VERIFIED = "SETTLEMENT_VERIFIED"
    EXECUTION_FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"
    CANCELLED = "CANCELLED"

class ProviderExecutionResult(BaseModel):
    success: bool
    state: ActionExecutionState
    provider_name: str
    provider_action_ref: str
    is_simulated: bool
    message: str
    settlement_evidence: Optional[str] = None
    raw_details: Dict[str, Any] = {}

class SettlementVerificationResult(BaseModel):
    verified: bool
    state: ActionExecutionState
    settlement_ref: str
    amount_settled: float
    settled_at: datetime
    is_simulated: bool
    evidence_trail: str
    raw_details: Dict[str, Any] = {}

class PaymentProviderInterface(ABC):
    """
    Sovereign Payment Provider Adapter Interface.
    Enforces honest lifecycle separation: a guardrail passing does NOT mean
    the payment has succeeded. Success requires authoritative provider settlement verification.
    """

    @abstractmethod
    def execute_retry(
        self,
        payment_ref: str,
        amount: float,
        currency: str,
        strategy: str,
        idempotency_key: str,
        customer_context: Dict[str, Any]
    ) -> ProviderExecutionResult:
        """Dispatches bounded payment retry to payment gateway."""
        pass

    @abstractmethod
    def verify_settlement(
        self,
        payment_ref: str,
        amount: float,
        provider_action_ref: str
    ) -> SettlementVerificationResult:
        """Verifies authoritative settlement evidence from the payment processor."""
        pass

    @abstractmethod
    def query_status(self, provider_action_ref: str) -> Dict[str, Any]:
        """Queries authoritative status to safely resolve timeouts and ambiguous states."""
        pass
