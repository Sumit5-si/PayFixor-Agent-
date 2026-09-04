import pytest
import datetime
from backend.app.policies.guardrails import PolicyEngine
from backend.app.database.models import (
    Customer, Payment, Incident, IncidentStatus, PaymentMethod, PaymentStatus, ComplaintStatus
)


@pytest.mark.asyncio
async def test_policy_engine_enforces_stopping_and_escalation_rules(db_session):
    policy_engine = PolicyEngine(db_session)

    # 1. Test Incident Stopping Rule (Resolved Incident)
    resolved_incident = Incident(
        incident_id="INC_RESOLVED_TEST",
        segment="UPI + Bank_X",
        payment_method="UPI",
        bank="Bank_X",
        start_time=datetime.datetime.utcnow(),
        baseline_rate=0.05,
        current_rate=0.20,
        anomaly_ratio=4.0,
        sample_size=200,
        status=IncidentStatus.RESOLVED
    )
    decision = await policy_engine.evaluate_incident_policy(resolved_incident)
    assert not decision.allowed
    assert decision.status == "STOPPED"
    assert "RESOLVED" in decision.reason

    # 2. Test Customer Complaint Guardrail
    complaint_customer = Customer(
        customer_id="CUST_COMPLAINT_1",
        name="John Doe",
        email="john@example.com",
        complaint_status=ComplaintStatus.COMPLAINT
    )
    test_payment = Payment(
        payment_id="PAY_TEST_1",
        customer_id=complaint_customer.customer_id,
        order_id="ORD_1",
        amount=2500.0,
        payment_method=PaymentMethod.UPI,
        bank="Bank_X",
        psp="Razorpay",
        status=PaymentStatus.FAILED
    )
    active_incident = Incident(
        incident_id="INC_ACTIVE_TEST",
        segment="UPI + Bank_X",
        payment_method="UPI",
        bank="Bank_X",
        start_time=datetime.datetime.utcnow(),
        baseline_rate=0.05,
        current_rate=0.20,
        anomaly_ratio=4.0,
        sample_size=200,
        status=IncidentStatus.CONFIRMED,
        confidence=0.92
    )

    cust_decision = await policy_engine.evaluate_customer_payment_policy(
        complaint_customer, test_payment, active_incident
    )
    assert not cust_decision.allowed
    assert cust_decision.status == "HUMAN_REVIEW"
    assert cust_decision.requires_human_review

    # 3. Test High-Value Transaction Guardrail (e.g. >= ₹10,000)
    normal_customer = Customer(
        customer_id="CUST_NORMAL_1",
        name="Jane Doe",
        email="jane@example.com",
        complaint_status=ComplaintStatus.NORMAL
    )
    high_value_payment = Payment(
        payment_id="PAY_TEST_HIGH_VAL",
        customer_id=normal_customer.customer_id,
        order_id="ORD_HV_1",
        amount=15000.0,
        payment_method=PaymentMethod.UPI,
        bank="Bank_X",
        psp="Razorpay",
        status=PaymentStatus.FAILED
    )
    hv_decision = await policy_engine.evaluate_customer_payment_policy(
        normal_customer, high_value_payment, active_incident
    )
    assert not hv_decision.allowed
    assert hv_decision.status == "HUMAN_REVIEW"
    assert hv_decision.requires_human_review

    # 4. Test Normal Approved Payment
    approved_payment = Payment(
        payment_id="PAY_TEST_APPROVED",
        customer_id=normal_customer.customer_id,
        order_id="ORD_APP_1",
        amount=2499.0,
        payment_method=PaymentMethod.UPI,
        bank="Bank_X",
        psp="Razorpay",
        status=PaymentStatus.FAILED
    )
    app_decision = await policy_engine.evaluate_customer_payment_policy(
        normal_customer, approved_payment, active_incident
    )
    assert app_decision.allowed
    assert app_decision.status == "APPROVED"
