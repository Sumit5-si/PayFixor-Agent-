import pytest


@pytest.mark.asyncio
async def test_full_api_workflow(client):
    # 1. Root healthcheck
    resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.json()["product"] == "PayFixor Agent"

    # 2. Seed synthetic data
    seed_resp = await client.post(
        "/api/payments/seed-synthetic",
        json={
            "num_transactions": 200,
            "inject_incident": True,
            "incident_segment": "UPI + Bank_X",
            "degradation_multiplier": 4.0
        }
    )
    assert seed_resp.status_code == 200
    assert seed_resp.json()["status"] == "success"

    # 3. Trigger Anomaly Scan
    scan_resp = await client.post("/api/incidents/scan?lookback_hours=12&min_sample_size=15")
    assert scan_resp.status_code == 200
    incidents = scan_resp.json()
    assert len(incidents) >= 1

    incident_id = incidents[0]["incident_id"]

    # 4. Trigger Investigation on Incident
    inv_resp = await client.post(f"/api/incidents/{incident_id}/investigate")
    assert inv_resp.status_code == 200
    inv_data = inv_resp.json()
    assert inv_data["hypothesis"] is not None
    assert inv_data["confidence"] is not None

    # 5. Trigger Recovery Batch
    rec_resp = await client.post(
        "/api/recovery/trigger-batch",
        json={"incident_id": incident_id, "force_override_policy": False}
    )
    assert rec_resp.status_code == 200
    rec_data = rec_resp.json()
    assert rec_data["actions_created"] > 0

    # 6. Check Analytics Overview
    overview_resp = await client.get("/api/analytics/overview")
    assert overview_resp.status_code == 200
    kpis = overview_resp.json()
    assert "revenue_at_risk" in kpis
    assert "revenue_recovered" in kpis

    # 7. Check Agent Activity
    agent_resp = await client.get("/api/analytics/agent-activity")
    assert agent_resp.status_code == 200
    agent_data = agent_resp.json()
    assert "detection_engine" in agent_data
    assert "diagnosis_agent" in agent_data

    # 8. Check Audit Logs
    audit_resp = await client.get("/api/analytics/audit-logs")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) > 0
