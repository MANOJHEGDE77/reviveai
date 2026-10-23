import random
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from app.payment_providers.base import (
    PaymentProviderInterface,
    ActionExecutionState,
    ProviderExecutionResult,
    SettlementVerificationResult
)

class SimulationProviderAdapter(PaymentProviderInterface):
    """
    Simulation Payment Adapter.
    Explicitly flags all actions as SIMULATED so the platform never misleads
    operators or presents demo executions as live payment settlements.
    """

    def __init__(self, failure_rate: float = 0.05):
        self.failure_rate = failure_rate

    def execute_retry(
        self,
        payment_ref: str,
        amount: float,
        currency: str,
        strategy: str,
        idempotency_key: str,
        customer_context: Dict[str, Any]
    ) -> ProviderExecutionResult:
        sim_ref = f"SIM_ACTION_{random.randint(100000, 999999)}"
        
        # Simulate slight network variance
        is_failure = random.random() < self.failure_rate
        if is_failure:
            return ProviderExecutionResult(
                success=False,
                state=ActionExecutionState.EXECUTION_FAILED,
                provider_name="SIMULATION_SANDBOX",
                provider_action_ref=sim_ref,
                is_simulated=True,
                message=f"[SIMULATION] Mock gateway returned temporary bank switch decline for strategy {strategy}.",
                raw_details={"idempotency_key": idempotency_key, "error": "SIM_DECLINE_RETRY"}
            )

        return ProviderExecutionResult(
            success=True,
            state=ActionExecutionState.SIMULATED_EXECUTION,
            provider_name="SIMULATION_SANDBOX",
            provider_action_ref=sim_ref,
            is_simulated=True,
            message=f"[SIMULATED EXECUTION] Dispatched {strategy} via simulated smart router. Idempotency lock: {idempotency_key[:8]}...",
            settlement_evidence=None, # Explicit: action dispatched does NOT equal settled!
            raw_details={"idempotency_key": idempotency_key, "strategy": strategy, "sim_ref": sim_ref}
        )

    def verify_settlement(
        self,
        payment_ref: str,
        amount: float,
        provider_action_ref: str
    ) -> SettlementVerificationResult:
        settlement_ref = f"SIM_SETTLED_{uuid.uuid4().hex[:12].upper()}"
        return SettlementVerificationResult(
            verified=True,
            state=ActionExecutionState.SETTLEMENT_VERIFIED,
            settlement_ref=settlement_ref,
            amount_settled=amount,
            settled_at=datetime.now(timezone.utc),
            is_simulated=True,
            evidence_trail=f"[SIMULATION AUTHORITATIVE] Simulated 3DS capture verified. Settlement ID: {settlement_ref}. Provider action ref: {provider_action_ref}.",
            raw_details={"mode": "SIMULATION_TEST", "verified": True}
        )

    def query_status(self, provider_action_ref: str) -> Dict[str, Any]:
        return {
            "provider_action_ref": provider_action_ref,
            "status": "CAPTURED",
            "is_simulated": True,
            "latency_ms": 142
        }
