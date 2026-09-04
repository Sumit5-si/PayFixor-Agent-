import math
import uuid
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.app.database.models import Incident, IncidentStatus
from backend.app.detection.baseline import BaselineCalculator
from backend.app.detection.segmentation import DataSegmentation
from backend.app.detection.revenue_risk import RevenueRiskCalculator
from backend.app.utils.config import settings


class AnomalyDetector:
    def __init__(
        self,
        db: AsyncSession,
        min_sample_size: Optional[int] = None,
        min_anomaly_ratio: Optional[float] = None,
        min_confidence: Optional[float] = None
    ):
        self.db = db
        self.min_sample_size = min_sample_size or settings.MIN_SAMPLE_SIZE
        self.min_anomaly_ratio = min_anomaly_ratio or settings.MIN_ANOMALY_RATIO
        self.min_confidence = min_confidence or settings.MIN_CONFIDENCE_THRESHOLD
        
        self.baseline_calc = BaselineCalculator(db)
        self.segmentation = DataSegmentation(db)
        self.risk_calc = RevenueRiskCalculator(db)

    def calculate_statistical_confidence(
        self,
        sample_size: int,
        baseline_rate: float,
        current_rate: float
    ) -> float:
        """
        Deterministic statistical significance score (approximation of binomial z-score p-value mapping).
        """
        if sample_size < 10 or baseline_rate <= 0:
            return 0.5

        p0 = baseline_rate
        se = math.sqrt(p0 * (1 - p0) / sample_size)
        if se == 0:
            return 0.5
            
        z = (current_rate - p0) / se
        if z <= 0:
            return 0.5
            
        confidence = 1.0 / (1.0 + math.exp(-0.8 * (z - 2.0)))
        return round(min(0.99, max(0.50, confidence)), 4)

    async def scan_for_anomalies(
        self,
        lookback_hours: int = 4,
        reference_time: Optional[datetime.datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Scans all payment segments within the window and detects anomalies.
        Returns a list of anomaly candidate descriptors.
        """
        if reference_time is None:
            reference_time = datetime.datetime.utcnow()
            
        start_time = reference_time - datetime.timedelta(hours=lookback_hours)
        end_time = reference_time

        segment_metrics = await self.segmentation.get_segment_metrics(start_time, end_time)
        detected_anomalies = []

        for seg in segment_metrics:
            sample_size = seg["total_tx"]
            current_rate = seg["failure_rate"]
            method = seg["payment_method"]
            bank = seg["bank"]
            psp = seg["psp"]

            if sample_size < self.min_sample_size:
                continue

            baseline_rate, hist_sample = await self.baseline_calc.get_segment_baseline(
                payment_method=method,
                bank=bank,
                reference_time=reference_time
            )

            effective_base = max(baseline_rate, 0.01)
            anomaly_ratio = round(current_rate / effective_base, 2)
            confidence = self.calculate_statistical_confidence(sample_size, baseline_rate, current_rate)

            if anomaly_ratio >= self.min_anomaly_ratio and current_rate > baseline_rate:
                revenue_at_risk = await self.risk_calc.calculate_risk_for_segment(
                    payment_method=method,
                    bank=bank,
                    start_time=start_time,
                    end_time=end_time
                )

                detected_anomalies.append({
                    "segment": seg["segment_name"],
                    "payment_method": method,
                    "bank": bank,
                    "psp": psp,
                    "start_time": start_time,
                    "end_time": end_time,
                    "baseline_rate": baseline_rate,
                    "current_rate": current_rate,
                    "anomaly_ratio": anomaly_ratio,
                    "sample_size": sample_size,
                    "failed_count": seg["failed_tx"],
                    "revenue_at_risk": revenue_at_risk,
                    "confidence": confidence
                })

        return detected_anomalies

    async def detect_and_create_incidents(
        self,
        lookback_hours: int = 4,
        reference_time: Optional[datetime.datetime] = None
    ) -> List[Incident]:
        """
        Detects anomalies and creates or updates incidents in the database.
        """
        candidates = await self.scan_for_anomalies(lookback_hours, reference_time)
        created_incidents = []

        for c in candidates:
            # Check if an active incident already exists for this segment
            stmt = select(Incident).where(
                and_(
                    Incident.segment == c["segment"],
                    Incident.status.in_([
                        IncidentStatus.DETECTED,
                        IncidentStatus.INVESTIGATING,
                        IncidentStatus.CONFIRMED,
                        IncidentStatus.RECOVERY_ACTIVE,
                        IncidentStatus.MONITORING
                    ])
                )
            )
            res = await self.db.execute(stmt)
            existing = res.scalar_one_or_none()

            if existing:
                existing.current_rate = c["current_rate"]
                existing.anomaly_ratio = c["anomaly_ratio"]
                existing.sample_size = c["sample_size"]
                existing.failed_count = c["failed_count"]
                existing.revenue_at_risk = c["revenue_at_risk"]
                existing.confidence = c["confidence"]
                existing.updated_at = datetime.datetime.utcnow()
                created_incidents.append(existing)
            else:
                new_incident = Incident(
                    incident_id=f"INC_{uuid.uuid4().hex[:8].upper()}",
                    segment=c["segment"],
                    payment_method=c["payment_method"],
                    bank=c["bank"],
                    psp=c["psp"],
                    start_time=c["start_time"],
                    end_time=c["end_time"],
                    baseline_rate=c["baseline_rate"],
                    current_rate=c["current_rate"],
                    anomaly_ratio=c["anomaly_ratio"],
                    sample_size=c["sample_size"],
                    failed_count=c["failed_count"],
                    revenue_at_risk=c["revenue_at_risk"],
                    recovered_revenue=0.0,
                    status=IncidentStatus.DETECTED,
                    confidence=c["confidence"]
                )
                self.db.add(new_incident)
                created_incidents.append(new_incident)

        await self.db.commit()
        return created_incidents
