from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from backend.app.database.models import (
    Incident, RecoveryAction, RecoveryStatus, IncidentStatus, Payment
)


class RecoveryMetricsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview_kpis(self) -> Dict[str, Any]:
        """
        Calculates all high-level business KPIs strictly from database records.
        """
        # 1. Total revenue at risk across all incidents
        risk_stmt = select(func.sum(Incident.revenue_at_risk))
        risk_res = await self.db.execute(risk_stmt)
        total_risk = float(risk_res.scalar_one() or 0.0)

        # 2. Total revenue recovered
        rec_stmt = select(func.sum(RecoveryAction.amount)).where(
            RecoveryAction.status == RecoveryStatus.RECOVERED
        )
        rec_res = await self.db.execute(rec_stmt)
        total_recovered = float(rec_res.scalar_one() or 0.0)

        # 3. Customer counts
        targeted_stmt = select(func.count(RecoveryAction.action_id))
        targeted_count = (await self.db.execute(targeted_stmt)).scalar_one() or 0

        recovered_cust_stmt = select(func.count(RecoveryAction.action_id)).where(
            RecoveryAction.status == RecoveryStatus.RECOVERED
        )
        recovered_count = (await self.db.execute(recovered_cust_stmt)).scalar_one() or 0

        recovery_rate = round((recovered_count / targeted_count) * 100, 2) if targeted_count > 0 else 0.0

        # 4. Active Incidents count
        active_inc_stmt = select(func.count(Incident.incident_id)).where(
            Incident.status.in_([
                IncidentStatus.DETECTED,
                IncidentStatus.INVESTIGATING,
                IncidentStatus.CONFIRMED,
                IncidentStatus.RECOVERY_ACTIVE,
                IncidentStatus.MONITORING
            ])
        )
        active_incidents = (await self.db.execute(active_inc_stmt)).scalar_one() or 0

        return {
            "revenue_at_risk": round(total_risk, 2),
            "revenue_recovered": round(total_recovered, 2),
            "recovery_rate": recovery_rate,
            "targeted_customers": targeted_count,
            "customers_recovered": recovered_count,
            "active_incidents": active_incidents
        }
