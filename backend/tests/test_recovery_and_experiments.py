import pytest
import datetime
from sqlalchemy import select
from backend.app.database.models import (
    Incident, IncidentStatus, PaymentMethod, RecoveryAction, RecoveryStatus, ExperimentGroup
)
from backend.app.data.generator import seed_synthetic_database
from backend.app.services.recovery_service import RecoveryService
from backend.app.evaluation.experiments import ExperimentEngine


@pytest.mark.asyncio
async def test_recovery_batch_execution_and_experiment_lift(db_session):
    # 1. Seed incident and failed transactions
    await seed_synthetic_database(
        db=db_session,
        num_customers=50,
        num_payments=200,
        inject_incident=True,
        incident_bank="Bank_X",
        incident_method=PaymentMethod.UPI,
        degradation_rate=0.30
    )

    incident = Incident(
        incident_id="INC_REC_TEST",
        segment="UPI + Bank_X",
        payment_method="UPI",
        bank="Bank_X",
        start_time=datetime.datetime.utcnow() - datetime.timedelta(hours=4),
        end_time=datetime.datetime.utcnow(),
        baseline_rate=0.05,
        current_rate=0.25,
        anomaly_ratio=5.0,
        sample_size=100,
        failed_count=25,
        revenue_at_risk=35000.0,
        status=IncidentStatus.CONFIRMED,
        confidence=0.92,
        hypothesis="Bank_X UPI acquiring switch degradation",
        recommended_strategy="ALTERNATIVE_PAYMENT_METHOD"
    )
    db_session.add(incident)
    await db_session.commit()

    # 2. Execute Recovery Batch
    recovery_service = RecoveryService(db_session)
    batch_summary = await recovery_service.execute_recovery_batch(incident.incident_id)

    assert batch_summary["actions_created"] > 0
    assert batch_summary["control_count"] + batch_summary["treatment_count"] == batch_summary["actions_created"]

    # 3. Verify created recovery actions
    actions_stmt = select(RecoveryAction).where(RecoveryAction.incident_id == incident.incident_id)
    actions = (await db_session.execute(actions_stmt)).scalars().all()
    assert len(actions) == batch_summary["actions_created"]

    for action in actions:
        assert action.payment_link_id is not None
        assert action.payment_link_url is not None
        assert action.personalized_message is not None
        assert action.status == RecoveryStatus.SENT

    # 4. Simulate recovery on treatment actions and control actions
    for a in actions:
        grp = getattr(a.experiment_group, 'value', a.experiment_group)
        if grp == "TREATMENT" or a.experiment_group == ExperimentGroup.TREATMENT:
            a.status = RecoveryStatus.RECOVERED
        elif grp == "CONTROL" or a.experiment_group == ExperimentGroup.CONTROL:
            a.status = RecoveryStatus.RECOVERED
    await db_session.commit()

    # 5. Evaluate Experiment Results
    exp_engine = ExperimentEngine(db_session)
    exp_results = await exp_engine.calculate_experiment_results(incident.incident_id)

    assert exp_results["control"]["recovered"] >= 1
    assert exp_results["treatment"]["recovered"] >= 1
    assert exp_results["control"]["revenue"] > 0
    assert exp_results["treatment"]["revenue"] > 0
