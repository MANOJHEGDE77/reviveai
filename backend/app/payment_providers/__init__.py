from app.config import settings
from app.payment_providers.base import (
    PaymentProviderInterface,
    ActionExecutionState,
    ProviderExecutionResult,
    SettlementVerificationResult
)
from app.payment_providers.simulation import SimulationProviderAdapter
from app.payment_providers.razorpay_adapter import RazorpayProviderAdapter

def get_payment_provider() -> PaymentProviderInterface:
    """
    Returns the configured payment provider adapter.
    Defaults to SimulationProviderAdapter unless explicitly configured for Razorpay.
    """
    mode = getattr(settings, "PAYMENT_PROVIDER_MODE", "simulation").lower()
    if mode in ["razorpay", "razorpay_test", "razorpay_live"]:
        return RazorpayProviderAdapter()
    return SimulationProviderAdapter()
