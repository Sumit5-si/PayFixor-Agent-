import pytest
from backend.app.data.generator import seed_synthetic_database
from backend.app.detection.anomaly_detector import AnomalyDetector
from backend.app.database.models import Incident, PaymentMethod, IncidentStatus


@pytest.mark.asyncio
async def test_anomaly_detection_identifies_injected_incident(db_session):
    # 1. Seed database with systemic degradation on UPI + Bank_X
    seed_result = await seed_synthetic_database(
        db=db_session,
        num_customers=50,
        num_payments=300,
        inject_incident=True,
        incident_bank="Bank_X",
        incident_method=PaymentMethod.UPI,
        degradation_rate=0.25
    )
    assert seed_result["payments_created"] == 300
    assert seed_result["failed_payments"] > 0

    # 2. Run Anomaly Detection
    detector = AnomalyDetector(
        db=db_session,
        min_sample_size=20,
        min_anomaly_ratio=1.8,
        min_confidence=0.70
    )
    
    incidents = await detector.detect_and_create_incidents(lookback_hours=12)
    assert len(incidents) >= 1

    # Verify detected incident properties
    upi_incident = next((i for i in incidents if "Bank_X" in i.segment), None)
    assert upi_incident is not None
    assert upi_incident.payment_method == "UPI"
    assert upi_incident.bank == "Bank_X"
    assert upi_incident.anomaly_ratio >= 1.8
    assert upi_incident.current_rate > upi_incident.baseline_rate
    assert upi_incident.revenue_at_risk > 0.0
    assert upi_incident.status == IncidentStatus.DETECTED
