from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class IncidentEvidenceSchema(BaseModel):
    evidence_id: str
    incident_id: str
    evidence_type: str
    data_json: Dict[str, Any]
    collected_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentResponse(BaseModel):
    incident_id: str
    segment: str
    payment_method: str
    bank: str
    psp: Optional[str] = "Razorpay"
    start_time: datetime
    end_time: Optional[datetime] = None
    baseline_rate: float
    current_rate: float
    anomaly_ratio: float
    sample_size: int
    failed_count: int
    revenue_at_risk: float
    recovered_revenue: float
    status: str
    confidence: Optional[float] = None
    hypothesis: Optional[str] = None
    supporting_evidence: Optional[List[Any]] = None
    unknowns: Optional[List[Any]] = None
    recommended_strategy: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentDetailResponse(IncidentResponse):
    evidences: List[IncidentEvidenceSchema] = []


class IncidentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class DiagnosisOutputSchema(BaseModel):
    hypothesis: str
    confidence: float = Field(ge=0.0, le=1.0)
    supporting_evidence: List[str]
    unknowns: List[str]
    recommended_recovery_strategy: str
