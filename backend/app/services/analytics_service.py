from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from backend.app.database.models import (
    Incident, RecoveryAction, RecoveryStatus, IncidentStatus, Payment,
    AgentAction, ExperimentResult, ExperimentGroup, AuditLog
)
from backend.app.evaluation.metrics import RecoveryMetricsService


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.metrics_service = RecoveryMetricsService(db)

    async def get_overview_kpis(self) -> Dict[str, Any]:
        base_kpis = await self.metrics_service.get_overview_kpis()
        
        incr_stmt = select(
            func.sum(ExperimentResult.incremental_revenue),
            func.avg(ExperimentResult.relative_lift)
        ).where(ExperimentResult.group == ExperimentGroup.TREATMENT)
        incr_res = await self.db.execute(incr_stmt)
        row = incr_res.one()
        incr_rev = float(row[0] or 0.0)
        avg_lift = float(row[1] or 0.0)

        actions_stmt = select(func.count(AgentAction.action_id))
        ai_actions_count = (await self.db.execute(actions_stmt)).scalar_one() or 0

        return {
            "revenue_at_risk": base_kpis["revenue_at_risk"],
            "revenue_recovered": base_kpis["revenue_recovered"],
            "recovery_rate": base_kpis["recovery_rate"],
            "incremental_revenue": round(incr_rev, 2),
            "recovery_lift": round(avg_lift, 2),
            "active_incidents": base_kpis["active_incidents"],
            "customers_recovered": base_kpis["customers_recovered"],
            "ai_actions_count": ai_actions_count
        }

    async def get_agent_activity_summary(self) -> Dict[str, Any]:
        incidents_detected_stmt = select(func.count(Incident.incident_id))
        detected_count = (await self.db.execute(incidents_detected_stmt)).scalar_one() or 0
        
        investigated_stmt = select(func.count(Incident.incident_id)).where(
            Incident.status != IncidentStatus.DETECTED
        )
        investigated_count = (await self.db.execute(investigated_stmt)).scalar_one() or 0

        insufficient_stmt = select(func.count(Incident.incident_id)).where(
            Incident.status == IncidentStatus.INSUFFICIENT_EVIDENCE
        )
        insufficient_count = (await self.db.execute(insufficient_stmt)).scalar_one() or 0

        diag_total_stmt = select(func.count(AgentAction.action_id)).where(
            AgentAction.agent_name == "DiagnosisAgent"
        )
        diag_total = (await self.db.execute(diag_total_stmt)).scalar_one() or 0

        diag_high_conf_stmt = select(func.count(AgentAction.action_id)).where(
            and_(
                AgentAction.agent_name == "DiagnosisAgent",
                AgentAction.confidence >= 0.85
            )
        )
        diag_high_conf = (await self.db.execute(diag_high_conf_stmt)).scalar_one() or 0

        rec_actions_stmt = select(func.count(RecoveryAction.action_id))
        rec_actions = (await self.db.execute(rec_actions_stmt)).scalar_one() or 0

        successful_rec_stmt = select(func.count(RecoveryAction.action_id)).where(
            RecoveryAction.status == RecoveryStatus.RECOVERED
        )
        successful_rec = (await self.db.execute(successful_rec_stmt)).scalar_one() or 0

        approved_stmt = select(func.count(AuditLog.log_id)).where(
            AuditLog.result == "SENT"
        )
        approved_count = (await self.db.execute(approved_stmt)).scalar_one() or 0

        escalated_stmt = select(func.count(AuditLog.log_id)).where(
            AuditLog.result == "HUMAN_REVIEW"
        )
        escalated_count = (await self.db.execute(escalated_stmt)).scalar_one() or 0

        stopped_stmt = select(func.count(AuditLog.log_id)).where(
            AuditLog.result == "STOPPED"
        )
        stopped_count = (await self.db.execute(stopped_stmt)).scalar_one() or 0

        return {
            "detection_engine": {
                "incidents_detected": detected_count,
                "investigations_completed": investigated_count,
                "insufficient_evidence_cases": insufficient_count
            },
            "diagnosis_agent": {
                "diagnoses_generated": diag_total,
                "high_confidence_diagnoses": diag_high_conf,
                "uncertain_diagnoses": diag_total - diag_high_conf
            },
            "recovery_agent": {
                "recovery_actions_dispatched": rec_actions,
                "successful_recoveries": successful_rec,
                "recovery_success_rate": round((successful_rec / rec_actions) * 100, 2) if rec_actions > 0 else 0.0
            },
            "policy_engine": {
                "actions_approved": approved_count,
                "actions_stopped": stopped_count,
                "human_escalations": escalated_count
            }
        }
