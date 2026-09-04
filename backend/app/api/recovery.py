import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.database.session import get_db
from backend.app.database.models import (
    RecoveryAction, RecoveryStatus, Incident, Experiment, ExperimentResult
)
from backend.app.schemas.recovery import (
    RecoveryActionResponse, TriggerRecoveryBatchRequest, RecoveryBatchSummary
)
from backend.app.schemas.analytics import ExperimentSummarySchema
from backend.app.services.recovery_service import RecoveryService
from backend.app.evaluation.experiments import ExperimentEngine
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/recovery", tags=["Recovery"])


@router.post("/trigger-batch", response_model=RecoveryBatchSummary)
async def trigger_recovery_batch(
    req: TriggerRecoveryBatchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes an AI recovery batch for an incident, enforcing deterministic guardrails.
    """
    service = RecoveryService(db)
    summary = await service.execute_recovery_batch(
        incident_id=req.incident_id,
        force_override_policy=req.force_override_policy
    )
    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary["error"])
    return summary


@router.get("/actions", response_model=List[RecoveryActionResponse])
async def list_recovery_actions(
    incident_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RecoveryAction).order_by(desc(RecoveryAction.created_at)).offset(skip).limit(limit)
    if incident_id:
        stmt = stmt.where(RecoveryAction.incident_id == incident_id)
    if status:
        stmt = stmt.where(RecoveryAction.status == status)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/experiments/{incident_id}")
async def get_incident_experiment(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    engine = ExperimentEngine(db)
    results = await engine.calculate_experiment_results(incident_id)
    return results


@router.post("/simulate-customer-recovery/{action_id}")
async def simulate_customer_recovery(
    action_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates a customer completing the Razorpay payment link.
    Verifies payment, updates recovery status, recalculates lift & money recovered.
    """
    stmt = select(RecoveryAction).where(RecoveryAction.action_id == action_id)
    res = await db.execute(stmt)
    action = res.scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail="Recovery action not found")

    action.status = RecoveryStatus.RECOVERED
    action.recovered_at = datetime.datetime.utcnow()

    inc_stmt = select(Incident).where(Incident.incident_id == action.incident_id)
    inc_res = await db.execute(inc_stmt)
    incident = inc_res.scalar_one_or_none()
    if incident:
        incident.recovered_revenue = round(incident.recovered_revenue + action.amount, 2)

    audit = AuditService(db)
    await audit.log_event(
        event_type="PAYMENT_RECOVERED",
        actor="RazorpayWebhookSimulator",
        action=f"Payment recovered for customer {action.customer_id}",
        result="RECOVERED",
        incident_id=action.incident_id,
        customer_id=action.customer_id,
        amount=action.amount,
        metadata_json={
            "action_id": action.action_id,
            "group": action.experiment_group.value,
            "strategy": action.strategy.value
        }
    )

    await db.commit()

    exp_engine = ExperimentEngine(db)
    exp_results = await exp_engine.calculate_experiment_results(action.incident_id)

    return {
        "status": "success",
        "action_id": action.action_id,
        "amount_recovered": action.amount,
        "experiment_update": exp_results
    }
