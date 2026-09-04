import uuid
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from backend.app.database.models import (
    Payment, PaymentStatus, Incident, IncidentEvidence, Customer
)
from backend.app.detection.baseline import BaselineCalculator
from backend.app.detection.segmentation import DataSegmentation
from backend.app.detection.revenue_risk import RevenueRiskCalculator


class InvestigationAgent:
    """
    Deterministic data gathering tools to collect rigorous evidence
    prior to invoking the AI Diagnosis Agent.
    """
    def __init__(self, db: AsyncSession):
        self.db = db
        self.baseline_calc = BaselineCalculator(db)
        self.segmentation = DataSegmentation(db)
        self.risk_calc = RevenueRiskCalculator(db)

    async def get_failures_by_bank(
        self,
        payment_method: str,
        start_time: datetime.datetime,
        end_time: datetime.datetime
    ) -> Dict[str, float]:
        """
        Calculates failure rate across all banks for a specific payment method.
        """
        stmt = (
            select(
                Payment.bank,
                func.count(Payment.payment_id).label("total"),
                func.sum(
                    case((Payment.status == PaymentStatus.FAILED, 1), else_=0)
                ).label("failed")
            )
            .where(
                and_(
                    Payment.payment_method == payment_method,
                    Payment.timestamp >= start_time,
                    Payment.timestamp <= end_time
                )
            )
            .group_by(Payment.bank)
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        return {
            row[0]: round(row[2] / row[1], 4) if row[1] > 0 else 0.0
            for row in rows
        }

    async def get_failures_by_method(
        self,
        start_time: datetime.datetime,
        end_time: datetime.datetime
    ) -> Dict[str, float]:
        """
        Calculates failure rate across all payment methods.
        """
        stmt = (
            select(
                Payment.payment_method,
                func.count(Payment.payment_id).label("total"),
                func.sum(
                    case((Payment.status == PaymentStatus.FAILED, 1), else_=0)
                ).label("failed")
            )
            .where(
                and_(
                    Payment.timestamp >= start_time,
                    Payment.timestamp <= end_time
                )
            )
            .group_by(Payment.payment_method)
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        return {
            (row[0].value if hasattr(row[0], "value") else str(row[0])): round(row[2] / row[1], 4) if row[1] > 0 else 0.0
            for row in rows
        }

    async def get_failures_by_time(
        self,
        payment_method: str,
        bank: str,
        start_time: datetime.datetime,
        end_time: datetime.datetime
    ) -> List[Dict[str, Any]]:
        """
        Gives hourly trend of failures for the affected segment.
        """
        stmt = (
            select(
                Payment.timestamp,
                Payment.status
            )
            .where(
                and_(
                    Payment.payment_method == payment_method,
                    Payment.bank == bank,
                    Payment.timestamp >= start_time,
                    Payment.timestamp <= end_time
                )
            )
            .order_by(Payment.timestamp)
        )
        res = await self.db.execute(stmt)
        records = res.all()
        
        hourly: Dict[str, Dict[str, int]] = {}
        for p_time, status in records:
            hr_key = p_time.strftime("%Y-%m-%d %H:00")
            if hr_key not in hourly:
                hourly[hr_key] = {"total": 0, "failed": 0}
            hourly[hr_key]["total"] += 1
            if status == PaymentStatus.FAILED:
                hourly[hr_key]["failed"] += 1

        return [
            {
                "hour": hr,
                "total": data["total"],
                "failed": data["failed"],
                "failure_rate": round(data["failed"] / data["total"], 4) if data["total"] > 0 else 0.0
            }
            for hr, data in sorted(hourly.items())
        ]

    async def get_affected_customers(
        self,
        payment_method: str,
        bank: str,
        start_time: datetime.datetime,
        end_time: datetime.datetime
    ) -> List[Dict[str, Any]]:
        """
        Returns list of customers who suffered failed payments in this incident.
        """
        stmt = (
            select(
                Customer.customer_id,
                Customer.name,
                Customer.email,
                Payment.payment_id,
                Payment.amount,
                Payment.error_code,
                Payment.timestamp
            )
            .join(Payment, Payment.customer_id == Customer.customer_id)
            .where(
                and_(
                    Payment.payment_method == payment_method,
                    Payment.bank == bank,
                    Payment.status == PaymentStatus.FAILED,
                    Payment.timestamp >= start_time,
                    Payment.timestamp <= end_time
                )
            )
            .order_by(Payment.timestamp.desc())
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        return [
            {
                "customer_id": r[0],
                "name": r[1],
                "email": r[2],
                "payment_id": r[3],
                "amount": float(r[4]),
                "error_code": r[5],
                "timestamp": r[6].isoformat()
            }
            for r in rows
        ]

    async def investigate_incident(self, incident: Incident) -> Dict[str, Any]:
        """
        Executes full investigation pipeline and attaches structured evidence to the incident.
        """
        start_time = incident.start_time
        end_time = incident.end_time or datetime.datetime.utcnow()

        bank_comparison = await self.get_failures_by_bank(incident.payment_method, start_time, end_time)
        method_comparison = await self.get_failures_by_method(start_time, end_time)
        time_series = await self.get_failures_by_time(incident.payment_method, incident.bank, start_time, end_time)
        error_dist = await self.segmentation.get_error_distribution(incident.payment_method, incident.bank, start_time, end_time)
        affected_customers = await self.get_affected_customers(incident.payment_method, incident.bank, start_time, end_time)
        
        baseline_rate, _ = await self.baseline_calc.get_segment_baseline(
            payment_method=incident.payment_method,
            bank=incident.bank,
            reference_time=end_time
        )

        evidence_bundle = {
            "incident_id": incident.incident_id,
            "segment": incident.segment,
            "payment_method": incident.payment_method,
            "bank": incident.bank,
            "baseline_failure_rate": baseline_rate,
            "current_failure_rate": incident.current_rate,
            "anomaly_ratio": incident.anomaly_ratio,
            "sample_size": incident.sample_size,
            "failed_count": incident.failed_count,
            "revenue_at_risk": incident.revenue_at_risk,
            "time_window": f"{start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}",
            "bank_comparison": bank_comparison,
            "method_comparison": method_comparison,
            "time_series": time_series,
            "error_distribution": error_dist,
            "affected_customer_count": len(affected_customers)
        }

        evidence_record = IncidentEvidence(
            evidence_id=f"EVD_{uuid.uuid4().hex[:8].upper()}",
            incident_id=incident.incident_id,
            evidence_type="comprehensive_evidence_bundle",
            data_json=evidence_bundle
        )
        self.db.add(evidence_record)
        await self.db.commit()

        return evidence_bundle
