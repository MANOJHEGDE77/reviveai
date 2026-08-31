from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import Customer, Payment, PaymentEvent, RecoveryWorkflow, RecoveryAction, ApprovalRequest, AuditLog

def seed_demo_data(db: Session):
    """
    Seeds rich, realistic Indian fintech merchant data for ReviveAI.
    Ensures zero empty dashboard upon first boot.
    """
    if db.query(Customer).first() is not None:
        return # Database already populated

    now = datetime.now(timezone.utc)

    # 1. Customers
    customers_data = [
        Customer(
            customer_ref="CUS_82931",
            name="Acme Technologies India Pvt Ltd",
            email="billing@acmetech.in",
            phone="+91 98450 12345",
            payment_method_masked="•••• 4821",
            payment_method_type="CARD",
            lifetime_value=184200.0,
            successful_transactions=18,
            failed_transactions=2,
            health_score=92,
            created_at=now - timedelta(days=90)
        ),
        Customer(
            customer_ref="CUS_19482",
            name="Swiggy Cloud Kitchen Partner",
            email="accounts@cloudkitchens.in",
            phone="+91 98110 99881",
            payment_method_masked="swiggy@okhdfcbank",
            payment_method_type="UPI",
            lifetime_value=76500.0,
            successful_transactions=9,
            failed_transactions=1,
            health_score=88,
            created_at=now - timedelta(days=60)
        ),
        Customer(
            customer_ref="CUS_40219",
            name="BharatMart D2C Apparel",
            email="finance@bharatmart.com",
            phone="+91 97123 44556",
            payment_method_masked="•••• 9012",
            payment_method_type="CARD",
            lifetime_value=125000.0,
            successful_transactions=12,
            failed_transactions=3,
            health_score=78,
            created_at=now - timedelta(days=45)
        ),
        Customer(
            customer_ref="CUS_63910",
            name="FreshDesk Enterprise Hub",
            email="pay@freshhub.co",
            phone="+91 99001 22334",
            payment_method_masked="HDFC NetBanking #4910",
            payment_method_type="NETBANKING",
            lifetime_value=310000.0,
            successful_transactions=24,
            failed_transactions=2,
            health_score=95,
            created_at=now - timedelta(days=120)
        ),
        Customer(
            customer_ref="CUS_77192",
            name="Zepto DarkStore Logistics",
            email="ops@zeptologistics.in",
            phone="+91 98334 55667",
            payment_method_masked="zepto@icici",
            payment_method_type="UPI",
            lifetime_value=49500.0,
            successful_transactions=6,
            failed_transactions=1,
            health_score=84,
            created_at=now - timedelta(days=30)
        ),
    ]
    db.add_all(customers_data)
    db.flush()

    c1, c2, c3, c4, c5 = customers_data

    # 2. Payments (Failures, In Recovery, High-Value Approval, and Recovered)
    payments_data = [
        # Payment 1: ₹1,25,000 High-Value Enterprise Decline (Pending Approval)
        Payment(
            payment_ref="PAY_99101",
            customer_id=c4.id,
            amount=125000.0,
            currency="INR",
            status="REQUIRES_APPROVAL",
            failure_category="SUBSCRIPTION_DECLINE",
            failure_code="ISSUER_THROTTLED",
            failure_reason="Recurring corporate mandate decline by beneficiary bank at settlement window.",
            risk_level="HIGH",
            recovery_probability=0.92,
            ai_recommendation="DELAYED_RETRY",
            ai_diagnosis_summary="Enterprise recurring invoice. Account has 24 successful history payments. Mandate failed due to bank server throttling. Safe to retry after 2 hours with human sign-off.",
            ai_confidence=92,
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(hours=3)
        ),
        # Payment 2: ₹24,500 Temporary Issuer Decline (In Recovery)
        Payment(
            payment_ref="PAY_88491",
            customer_id=c1.id,
            amount=24500.0,
            currency="INR",
            status="IN_RECOVERY",
            failure_category="TEMPORARY_DECLINE",
            failure_code="CARD_DECLINED_TEMP",
            failure_reason="Temporary issuer decline: HDFC switch intermittent drop.",
            risk_level="MEDIUM",
            recovery_probability=0.81,
            ai_recommendation="DELAYED_RETRY",
            ai_diagnosis_summary="Customer has completed 4 previous successful payments. Temporary issuer decline confirmed by Razorpay gateway logs. Retry in 2 hours.",
            ai_confidence=87,
            created_at=now - timedelta(hours=1, minutes=45),
            updated_at=now - timedelta(minutes=45)
        ),
        # Payment 3: ₹74,000 Checkout Abandonment (At Risk)
        Payment(
            payment_ref="PAY_77312",
            customer_id=c3.id,
            amount=74000.0,
            currency="INR",
            status="FAILED",
            failure_category="CHECKOUT_ABANDONED",
            failure_code="3DS_TIMEOUT",
            failure_reason="Customer dropped off at OTP authentication screen.",
            risk_level="MEDIUM",
            recovery_probability=0.76,
            ai_recommendation="DISCOUNTED_CHECKOUT_REENGAGEMENT",
            ai_diagnosis_summary="High-intent cart abandonment. Customer OTP expired. Dispatch 1-click checkout recovery link with timed 5% credit.",
            ai_confidence=82,
            created_at=now - timedelta(hours=4),
            updated_at=now - timedelta(hours=4)
        ),
        # Payment 4: ₹61,000 Subscription Failure (At Risk)
        Payment(
            payment_ref="PAY_66203",
            customer_id=c2.id,
            amount=61000.0,
            currency="INR",
            status="FAILED",
            failure_category="SUBSCRIPTION_DECLINE",
            failure_code="INSUFFICIENT_FUNDS_TEMP",
            failure_reason="Auto-debit mandate declined: insufficient funds balance at run time.",
            risk_level="HIGH",
            recovery_probability=0.68,
            ai_recommendation="SMART_ROUTING",
            ai_diagnosis_summary="Salary cycle mismatch. Retry auto-debit on 1st of month with pre-debit SMS intent link.",
            ai_confidence=84,
            created_at=now - timedelta(hours=6),
            updated_at=now - timedelta(hours=6)
        ),
        # Payment 5: ₹43,000 Overdue Invoice (At Risk)
        Payment(
            payment_ref="PAY_55104",
            customer_id=c1.id,
            amount=43000.0,
            currency="INR",
            status="FAILED",
            failure_category="OVERDUE_INVOICE",
            failure_code="INVOICE_EXPIRED",
            failure_reason="Custom B2B invoice past 30 days payment term.",
            risk_level="MEDIUM",
            recovery_probability=0.65,
            ai_recommendation="UPI_INTENT_SWITCH",
            ai_diagnosis_summary="Direct UPI dynamic QR link dispatched to procurement finance officer.",
            ai_confidence=78,
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1)
        ),
        # Payment 6: ₹32,000 Repeated Declines (At Risk)
        Payment(
            payment_ref="PAY_44095",
            customer_id=c5.id,
            amount=32000.0,
            currency="INR",
            status="FAILED",
            failure_category="REPEAT_DECLINE",
            failure_code="PSP_DOWN",
            failure_reason="Repeated UPI PSP failure code U30.",
            risk_level="HIGH",
            recovery_probability=0.74,
            ai_recommendation="SMART_ROUTING",
            ai_diagnosis_summary="Primary UPI PSP offline. Rerouted through ICICI UPI fallback rail.",
            ai_confidence=86,
            created_at=now - timedelta(hours=5),
            updated_at=now - timedelta(hours=5)
        ),
        # Payment 7: ₹12,500 Network Timeout (At Risk / Ready for Demo)
        Payment(
            payment_ref="PAY_33981",
            customer_id=c2.id,
            amount=12500.0,
            currency="INR",
            status="FAILED",
            failure_category="NETWORK_TIMEOUT",
            failure_code="HTTP_504_GATEWAY",
            failure_reason="Gateway network timeout (HTTP 504) during UPI intent handshake.",
            risk_level="LOW",
            recovery_probability=0.88,
            ai_recommendation="UPI_INTENT_SWITCH",
            ai_diagnosis_summary="PSP connection reset. Customer verified. Ready for immediate smart retry.",
            ai_confidence=91,
            created_at=now - timedelta(minutes=40),
            updated_at=now - timedelta(minutes=40)
        ),
        # Payment 8: ₹1,10,000 Successfully Recovered (Enterprise)
        Payment(
            payment_ref="PAY_22101",
            customer_id=c4.id,
            amount=110000.0,
            currency="INR",
            status="RECOVERED",
            failure_category="SUBSCRIPTION_DECLINE",
            failure_code="ISSUER_TEMP",
            failure_reason="Mandate declined initially due to bank switch lag.",
            risk_level="HIGH",
            recovery_probability=0.95,
            ai_recommendation="DELAYED_RETRY",
            ai_diagnosis_summary="Recovered after approved delayed retry.",
            ai_confidence=94,
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=1),
            recovered_at=now - timedelta(days=1)
        ),
        # Payment 9: ₹24,900 Successfully Recovered (D2C)
        Payment(
            payment_ref="PAY_11092",
            customer_id=c3.id,
            amount=24900.0,
            currency="INR",
            status="RECOVERED",
            failure_category="TEMPORARY_DECLINE",
            failure_code="CARD_DECLINED_TEMP",
            failure_reason="Temporary limit freeze.",
            risk_level="LOW",
            recovery_probability=0.85,
            ai_recommendation="DELAYED_RETRY",
            ai_diagnosis_summary="Recovered on autonomous 2-hour retry attempt #1.",
            ai_confidence=88,
            created_at=now - timedelta(days=3),
            updated_at=now - timedelta(days=2, hours=22),
            recovered_at=now - timedelta(days=2, hours=22)
        ),
        # Payment 10: ₹12,600 Successfully Recovered (UPI)
        Payment(
            payment_ref="PAY_10043",
            customer_id=c5.id,
            amount=12600.0,
            currency="INR",
            status="RECOVERED",
            failure_category="NETWORK_TIMEOUT",
            failure_code="UPI_TIMEOUT",
            failure_reason="UPI intent timeout.",
            risk_level="LOW",
            recovery_probability=0.92,
            ai_recommendation="UPI_INTENT_SWITCH",
            ai_diagnosis_summary="Recovered through ICICI secondary PSP rail.",
            ai_confidence=92,
            created_at=now - timedelta(days=4),
            updated_at=now - timedelta(days=3, hours=23),
            recovered_at=now - timedelta(days=3, hours=23)
        ),
    ]
    db.add_all(payments_data)
    db.flush()

    p_high_appr, p_in_rec, p_abandon, p_sub, p_inv, p_repeat, p_demo, p_rec1, p_rec2, p_rec3 = payments_data

    # 3. Workflows
    wf_appr = RecoveryWorkflow(
        workflow_ref="RV-10291",
        payment_id=p_high_appr.id,
        trigger_reason="Enterprise subscription mandate declined",
        diagnosis="Bank switch throttling for ₹1,25,000 corporate invoice.",
        strategy="DELAYED_RETRY",
        current_step="PENDING_HUMAN_APPROVAL",
        next_action="Awaiting Risk Lead sign-off in Approval Console",
        attempts=0,
        max_attempts=2,
        deadline_time=now + timedelta(hours=21),
        status="PENDING_APPROVAL"
    )
    wf_rec = RecoveryWorkflow(
        workflow_ref="RV-10292",
        payment_id=p_in_rec.id,
        trigger_reason="Temporary issuer decline from HDFC gateway",
        diagnosis="Temporary issuer decline is the most likely cause based on previous 4 successful transactions.",
        strategy="DELAYED_RETRY",
        current_step="WAITING_COOLDOWN_WINDOW",
        next_action="Autonomous retry scheduled in 1h 15m",
        attempts=1,
        max_attempts=2,
        deadline_time=now + timedelta(hours=22),
        status="ACTIVE"
    )
    wf_recovered = RecoveryWorkflow(
        workflow_ref="RV-10280",
        payment_id=p_rec1.id,
        trigger_reason="Mandate declined initially",
        diagnosis="Recovered successfully via delayed retry.",
        strategy="DELAYED_RETRY",
        current_step="PAYMENT_SETTLED",
        next_action="None (Workflow Completed)",
        attempts=1,
        max_attempts=2,
        deadline_time=now - timedelta(days=1),
        status="RESOLVED",
        result_message="Successfully recovered ₹1,10,000.00 via DELAYED_RETRY."
    )
    db.add_all([wf_appr, wf_rec, wf_recovered])
    db.flush()

    # 4. Approval Request for ₹1,25,000
    approval_req = ApprovalRequest(
        approval_ref="APP-4019",
        payment_id=p_high_appr.id,
        workflow_id=wf_appr.id,
        amount=125000.0,
        customer_name=c4.name,
        risk_level="HIGH",
        ai_recommendation="DELAYED_RETRY (Retry in 120m)",
        ai_confidence=92,
        evidence_reason="Customer has 24 previous successful transactions totaling ₹3.1L. Transaction value (₹1,25,000) exceeds automatic ₹50,000 threshold by policy.",
        status="PENDING"
    )
    db.add(approval_req)

    # 5. Timeline Events & Audit Logs
    db.add(PaymentEvent(
        payment_id=p_in_rec.id,
        event_type="PAYMENT_FAILED",
        description="Payment of ₹24,500 declined by HDFC Bank gateway. Error: CARD_DECLINED_TEMP.",
        actor="SYSTEM",
        created_at=now - timedelta(hours=1, minutes=45)
    ))
    db.add(PaymentEvent(
        payment_id=p_in_rec.id,
        event_type="AI_INVESTIGATION_STARTED",
        description="ReviveAI autonomous agent detected failure event and gathered customer transaction history.",
        actor="REVIVE_AI_AGENT",
        created_at=now - timedelta(hours=1, minutes=44)
    ))
    db.add(PaymentEvent(
        payment_id=p_in_rec.id,
        event_type="DIAGNOSIS_COMPLETED",
        description="AI Diagnosis: Temporary issuer decline (87% confidence). Strategy selected: DELAYED_RETRY.",
        actor="REVIVE_AI_AGENT",
        created_at=now - timedelta(hours=1, minutes=43)
    ))
    db.add(PaymentEvent(
        payment_id=p_in_rec.id,
        event_type="GUARDRAIL_VALIDATED",
        description="Deterministic Guardrail check passed: Attempts (0/2), Amount (₹24,500 < ₹50,000 threshold), Window (24h valid).",
        actor="SYSTEM",
        created_at=now - timedelta(hours=1, minutes=43)
    ))
    db.add(PaymentEvent(
        payment_id=p_in_rec.id,
        event_type="ACTION_EXECUTED",
        description="Executed recovery action DELAYED_RETRY (Attempt 1/2) via smart routing network.",
        actor="REVIVE_AI_AGENT",
        created_at=now - timedelta(minutes=45)
    ))

    # Audit Logs
    audit_entries = [
        AuditLog(
            timestamp=now - timedelta(minutes=12),
            actor="REVIVE_AI_AGENT",
            event_type="DIAGNOSIS",
            payment_ref="PAY_88491",
            customer_ref="CUS_82931",
            amount=24500.0,
            decision="Scheduled delayed retry (120 minutes)",
            reason="Temporary issuer decline with 87% historical cohort recovery confidence.",
            guardrail_result="PASSED",
            outcome_status="SCHEDULED"
        ),
        AuditLog(
            timestamp=now - timedelta(minutes=25),
            actor="REVIVE_AI_AGENT",
            event_type="STRATEGY_SELECTION",
            payment_ref="PAY_99101",
            customer_ref="CUS_63910",
            amount=125000.0,
            decision="Escalate to Human Approval console",
            reason="Amount exceeds ₹50,000 policy threshold. Safe customer history (24 previous successes).",
            guardrail_result="ESCALATED",
            outcome_status="SCHEDULED"
        ),
        AuditLog(
            timestamp=now - timedelta(hours=1, minutes=10),
            actor="SYSTEM",
            event_type="PAYMENT_RECOVERY",
            payment_ref="PAY_22101",
            customer_ref="CUS_63910",
            amount=110000.0,
            decision="Payment Successfully Recovered & Settled",
            reason="Recovered via autonomous DELAYED_RETRY workflow RV-10280.",
            guardrail_result="TERMINATED_ON_SUCCESS",
            outcome_status="SUCCESS"
        ),
        AuditLog(
            timestamp=now - timedelta(hours=2, minutes=30),
            actor="REVIVE_AI_AGENT",
            event_type="ACTION_EXECUTION",
            payment_ref="PAY_11092",
            customer_ref="CUS_40219",
            amount=24900.0,
            decision="Dispatched multi-gateway failover retry",
            reason="Attempt 1/2 within 24h recovery window.",
            guardrail_result="PASSED",
            outcome_status="SUCCESS"
        ),
        AuditLog(
            timestamp=now - timedelta(hours=3, minutes=15),
            actor="SYSTEM",
            event_type="GUARDRAIL_CHECK",
            payment_ref="PAY_77312",
            customer_ref="CUS_40219",
            amount=74000.0,
            decision="Approved 1-click checkout recovery link",
            reason="Non-financial SMS/Email notification limit: 1/1 verified.",
            guardrail_result="PASSED",
            outcome_status="SCHEDULED"
        ),
    ]
    db.add_all(audit_entries)

    db.commit()
