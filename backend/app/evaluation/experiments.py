import uuid
import datetime
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from backend.app.database.models import (
    Experiment, ExperimentResult, ExperimentGroup, RecoveryAction, RecoveryStatus, Incident
)


class ExperimentEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_experiment(self, incident_id: str) -> Experiment:
        stmt = select(Experiment).where(Experiment.incident_id == incident_id)
        res = await self.db.execute(stmt)
        exp = res.scalar_one_or_none()
        
        if not exp:
            exp = Experiment(
                experiment_id=f"EXP_{uuid.uuid4().hex[:8].upper()}",
                incident_id=incident_id,
                name=f"Control vs Treatment — {incident_id}",
                control_count=0,
                treatment_count=0
            )
            self.db.add(exp)
            await self.db.commit()
            await self.db.refresh(exp)
        return exp

    async def calculate_experiment_results(self, incident_id: str) -> Dict[str, Any]:
        """
        Deterministically computes Control vs Treatment performance from actual database records.
        """
        exp = await self.get_or_create_experiment(incident_id)

        # Get control stats
        ctrl_stmt = (
            select(
                func.count(RecoveryAction.action_id).label("targeted"),
                func.sum(
                    case((RecoveryAction.status == RecoveryStatus.RECOVERED, 1), else_=0)
                ).label("recovered_count"),
                func.sum(RecoveryAction.amount).label("targeted_rev"),
                func.sum(
                    case((RecoveryAction.status == RecoveryStatus.RECOVERED, RecoveryAction.amount), else_=0.0)
                ).label("recovered_rev")
            )
            .where(
                and_(
                    RecoveryAction.incident_id == incident_id,
                    RecoveryAction.experiment_group == ExperimentGroup.CONTROL
                )
            )
        )
        ctrl_res = (await self.db.execute(ctrl_stmt)).one()
        ctrl_targeted = ctrl_res[0] or 0
        ctrl_recovered = ctrl_res[1] or 0
        ctrl_targeted_rev = float(ctrl_res[2] or 0.0)
        ctrl_recovered_rev = float(ctrl_res[3] or 0.0)
        ctrl_rate = (ctrl_recovered / ctrl_targeted) if ctrl_targeted > 0 else 0.0

        # Get treatment stats
        treat_stmt = (
            select(
                func.count(RecoveryAction.action_id).label("targeted"),
                func.sum(
                    case((RecoveryAction.status == RecoveryStatus.RECOVERED, 1), else_=0)
                ).label("recovered_count"),
                func.sum(RecoveryAction.amount).label("targeted_rev"),
                func.sum(
                    case((RecoveryAction.status == RecoveryStatus.RECOVERED, RecoveryAction.amount), else_=0.0)
                ).label("recovered_rev")
            )
            .where(
                and_(
                    RecoveryAction.incident_id == incident_id,
                    RecoveryAction.experiment_group == ExperimentGroup.TREATMENT
                )
            )
        )
        treat_res = (await self.db.execute(treat_stmt)).one()
        treat_targeted = treat_res[0] or 0
        treat_recovered = treat_res[1] or 0
        treat_targeted_rev = float(treat_res[2] or 0.0)
        treat_recovered_rev = float(treat_res[3] or 0.0)
        treat_rate = (treat_recovered / treat_targeted) if treat_targeted > 0 else 0.0

        # Relative lift and incremental revenue
        relative_lift = 0.0
        if ctrl_rate > 0:
            relative_lift = round(((treat_rate - ctrl_rate) / ctrl_rate) * 100, 2)
        elif treat_rate > 0:
            relative_lift = 100.0

        # Incremental revenue calculation
        # Expected revenue if treatment had performed at control rate:
        expected_treat_rev_at_ctrl_rate = treat_targeted_rev * ctrl_rate
        incremental_revenue = round(max(0.0, treat_recovered_rev - expected_treat_rev_at_ctrl_rate), 2)

        # Update experiment records
        exp.control_count = ctrl_targeted
        exp.treatment_count = treat_targeted

        # Record / Update results
        for grp, count, rec_count, tgt_rev, rec_rev, rate, lift, incr in [
            (ExperimentGroup.CONTROL, ctrl_targeted, ctrl_recovered, ctrl_targeted_rev, ctrl_recovered_rev, ctrl_rate, None, None),
            (ExperimentGroup.TREATMENT, treat_targeted, treat_recovered, treat_targeted_rev, treat_recovered_rev, treat_rate, relative_lift, incremental_revenue)
        ]:
            res_stmt = select(ExperimentResult).where(
                and_(
                    ExperimentResult.experiment_id == exp.experiment_id,
                    ExperimentResult.group == grp
                )
            )
            res_obj = (await self.db.execute(res_stmt)).scalar_one_or_none()
            if not res_obj:
                res_obj = ExperimentResult(
                    result_id=f"EXPRES_{uuid.uuid4().hex[:8].upper()}",
                    experiment_id=exp.experiment_id,
                    group=grp
                )
                self.db.add(res_obj)

            res_obj.targeted_count = count
            res_obj.recovered_count = rec_count
            res_obj.targeted_revenue = tgt_rev
            res_obj.recovered_revenue = rec_rev
            res_obj.recovery_rate = round(rate, 4)
            res_obj.relative_lift = lift
            res_obj.incremental_revenue = incr
            res_obj.computed_at = datetime.datetime.utcnow()

        await self.db.commit()

        return {
            "experiment_id": exp.experiment_id,
            "incident_id": incident_id,
            "control": {
                "targeted": ctrl_targeted,
                "recovered": ctrl_recovered,
                "recovery_rate": round(ctrl_rate * 100, 2),
                "revenue": ctrl_recovered_rev
            },
            "treatment": {
                "targeted": treat_targeted,
                "recovered": treat_recovered,
                "recovery_rate": round(treat_rate * 100, 2),
                "revenue": treat_recovered_rev
            },
            "relative_lift_percentage": relative_lift,
            "incremental_revenue": incremental_revenue
        }
