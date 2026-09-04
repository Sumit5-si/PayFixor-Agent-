import pytest
import json
import datetime
from sqlalchemy import select
from backend.app.database.models import (
    Customer, Payment, PaymentStatus, Incident, IncidentStatus,
    RecoveryAction, RecoveryStatus, RecoveryStrategy, PaymentMethod
)
from backend.app.razorpay.client import razorpay_service


@pytest.mark.asyncio
async def test_webhook_payment_link_paid_updates_recovery_and_revenue(client, db_session):
    # Setup test customer and incident
    customer = Customer(
        customer_id="CUST_WH_1",
        name="Aarav Sharma",
        email="aarav@example.com"
    )
    db_session.add(customer)

    incident = Incident(
        incident_id="INC_WH_1",
        segment="UPI + Bank_X",
        payment_method="UPI",
        bank="Bank_X",
        start_time=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
        baseline_rate=0.05,
        current_rate=0.20,
        anomaly_ratio=4.0,
        sample_size=100,
        revenue_at_risk=20000.0,
        recovered_revenue=0.0,
        status=IncidentStatus.RECOVERY_ACTIVE
    )
    db_session.add(incident)

    action = RecoveryAction(
        action_id="ACT_WH_1",
        incident_id=incident.incident_id,
        customer_id=customer.customer_id,
        payment_link_id="plink_test_wh_123",
        payment_link_url="https://rzp.io/i/test123",
        amount=2499.0,
        strategy=RecoveryStrategy.ALTERNATIVE_PAYMENT_METHOD,
        status=RecoveryStatus.SENT
    )
    db_session.add(action)
    await db_session.commit()

    # Webhook payload for payment_link.paid
    webhook_payload = {
        "id": "evt_wh_test_12345",
        "event": "payment_link.paid",
        "payload": {
            "payment_link": {
                "entity": {
                    "id": "plink_test_wh_123",
                    "amount_paid": 249900,
                    "status": "paid"
                }
            }
        }
    }
    payload_str = json.dumps(webhook_payload)

    # In mock mode, signature check passes
    resp = await client.post(
        "/api/webhooks/razorpay",
        content=payload_str,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": "mock_sig"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

    # Verify action status is RECOVERED and incident recovered_revenue updated
    act_stmt = select(RecoveryAction).where(RecoveryAction.action_id == "ACT_WH_1")
    updated_action = (await db_session.execute(act_stmt)).scalar_one()
    assert updated_action.status == RecoveryStatus.RECOVERED

    inc_stmt = select(Incident).where(Incident.incident_id == "INC_WH_1")
    updated_inc = (await db_session.execute(inc_stmt)).scalar_one()
    assert updated_inc.recovered_revenue == 2499.0

    # Idempotency test: Send duplicate event
    dup_resp = await client.post(
        "/api/webhooks/razorpay",
        content=payload_str,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": "mock_sig"}
    )
    assert dup_resp.status_code == 200
    assert "Idempotent" in dup_resp.json()["message"]
    # Verify recovered_revenue was not double counted
    assert updated_inc.recovered_revenue == 2499.0
