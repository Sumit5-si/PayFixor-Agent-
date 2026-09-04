import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.app.database.models import Incident, IncidentStatus, IncidentEvidence
from backend.app.detection.anomaly_detector import AnomalyDetector
from backend.app.agents.investigation_agent import InvestigationAgent
from backend.app.agents.diagnosis_agent import DiagnosisAgent
from backend.app.services.audit_service import AuditService


class IncidentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.detector = AnomalyDetector(db)
        self.investigator = InvestigationAgent(db)
        self.diagnoser = DiagnosisAgent(db)
        self.audit = AuditService(db)

    async def run_detection_pipeline(
        self,
        lookback_hours: int = 4,
        min_sample_size: Optional[int] = None
    ) -> List[Incident]:
        """
        Runs anomaly detection, creates incidents, and initiates investigation & diagnosis.
        """
        if min_sample_size:
            self.detector.min_sample_size = min_sample_size

        incidents = await self.detector.detect_and_create_incidents(lookback_hours)

        for inc in incidents:
            if inc.status == IncidentStatus.DETECTED:
                await self.audit.log_event(
                    event_type="INCIDENT_DETECTED",
                    actor="AnomalyDetector",
                    action=f"Detected anomaly on {inc.segment}",
                    result="DETECTED",
                    reason=f"Anomaly ratio {inc.anomaly_ratio}x exceeded threshold on {inc.sample_size} sample transactions.",
                    incident_id=inc.incident_id,
                    amount=inc.revenue_at_risk,
                    metadata_json={
                        "baseline_rate": inc.baseline_rate,
                        "current_rate": inc.current_rate,
                        "anomaly_ratio": inc.anomaly_ratio
                    }
                )
                await self.process_incident_investigation(inc.incident_id)

        return incidents

    async def process_incident_investigation(self, incident_id: str) -> Optional[Incident]:
        stmt = select(Incident).where(Incident.incident_id == incident_id)
        res = await self.db.execute(stmt)
        incident = res.scalar_one_or_none()
        if not incident:
            return None

        incident.status = IncidentStatus.INVESTIGATING
        await self.db.commit()

        await self.audit.log_event(
            event_type="INVESTIGATION_STARTED",
            actor="InvestigationAgent",
            action=f"Started evidence collection for {incident.segment}",
            result="IN_PROGRESS",
            incident_id=incident.incident_id
        )

        evidence_bundle = await self.investigator.investigate_incident(incident)

        await self.audit.log_event(
            event_type="EVIDENCE_COLLECTED",
            actor="InvestigationAgent",
            action="Collected multi-dimensional failure evidence",
            result="SUCCESS",
            incident_id=incident.incident_id,
            metadata_json={"affected_customers": evidence_bundle.get("affected_customer_count")}
        )

        diagnosis = await self.diagnoser.diagnose(incident, evidence_bundle)

        await self.audit.log_event(
            event_type="DIAGNOSIS_GENERATED",
            actor="DiagnosisAgent",
            action="Generated evidence-backed root cause hypothesis",
            result=incident.status.value,
            reason=f"Confidence: {diagnosis.confidence:.2f}. Strategy: {diagnosis.recommended_recovery_strategy}",
            incident_id=incident.incident_id,
            metadata_json={
                "hypothesis": diagnosis.hypothesis,
                "confidence": diagnosis.confidence,
                "unknowns": diagnosis.unknowns
            }
        )

        return incident

    async def update_incident_status(
        self,
        incident_id: str,
        new_status: IncidentStatus,
        notes: Optional[str] = None
    ) -> Optional[Incident]:
        stmt = select(Incident).where(Incident.incident_id == incident_id)
        res = await self.db.execute(stmt)
        incident = res.scalar_one_or_none()
        if not incident:
            return None

        old_status = incident.status
        incident.status = new_status
        if new_status == IncidentStatus.RESOLVED:
            incident.end_time = datetime.datetime.utcnow()

        await self.db.commit()

        await self.audit.log_event(
            event_type="INCIDENT_STATUS_UPDATED",
            actor="MerchantAdmin",
            action=f"Changed incident status from {old_status.value} to {new_status.value}",
            result=new_status.value,
            reason=notes,
            incident_id=incident.incident_id
        )

        return incident
