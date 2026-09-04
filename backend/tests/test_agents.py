import pytest
import datetime
from backend.app.database.models import Incident, IncidentStatus, PaymentMethod
from backend.app.agents.investigation_agent import InvestigationAgent
from backend.app.agents.diagnosis_agent import DiagnosisAgent
from backend.app.data.generator import seed_synthetic_database


@pytest.mark.asyncio
async def test_investigation_and_diagnosis_agents(db_session):
    # Seed data
    await seed_synthetic_database(
        db=db_session,
        num_customers=50,
        num_payments=200,
        inject_incident=True,
        incident_bank="Bank_X",
        incident_method=PaymentMethod.UPI,
        degradation_rate=0.25
    )

    incident = Incident(
        incident_id="INC_AGENT_TEST",
        segment="UPI + Bank_X",
        payment_method="UPI",
        bank="Bank_X",
        start_time=datetime.datetime.utcnow() - datetime.timedelta(hours=4),
        end_time=datetime.datetime.utcnow(),
        baseline_rate=0.051,
        current_rate=0.22,
        anomaly_ratio=4.3,
        sample_size=150,
        failed_count=33,
        revenue_at_risk=45000.0,
        status=IncidentStatus.DETECTED
    )
    db_session.add(incident)
    await db_session.commit()

    # 1. Test Investigation Agent tools & bundle creation
    investigator = InvestigationAgent(db_session)
    evidence = await investigator.investigate_incident(incident)

    assert evidence["incident_id"] == incident.incident_id
    assert "bank_comparison" in evidence
    assert "time_series" in evidence
    assert "error_distribution" in evidence

    # 2. Test Diagnosis Agent
    diagnoser = DiagnosisAgent(db_session)
    diagnosis = await diagnoser.diagnose(incident, evidence)

    assert diagnosis.confidence >= 0.70
    assert len(diagnosis.supporting_evidence) > 0
    assert len(diagnosis.unknowns) > 0
    assert diagnosis.recommended_recovery_strategy in [
        "ALTERNATIVE_PAYMENT_METHOD", "RETRY_RECOMMENDATION", "RAZORPAY_PAYMENT_LINK"
    ]
    assert incident.hypothesis is not None
    assert incident.status in (IncidentStatus.CONFIRMED, IncidentStatus.INSUFFICIENT_EVIDENCE)
