from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class OverviewKPISchema(BaseModel):
    revenue_at_risk: float
    revenue_recovered: float
    recovery_rate: float
    incremental_revenue: float
    recovery_lift: float
    active_incidents: int
    customers_recovered: int
    ai_actions_count: int


class ExperimentSummarySchema(BaseModel):
    experiment_id: str
    incident_id: str
    incident_segment: str
    control_targeted: int
    control_recovered: int
    control_recovery_rate: float
    control_revenue: float
    treatment_targeted: int
    treatment_recovered: int
    treatment_recovery_rate: float
    treatment_revenue: float
    recovery_lift_percentage: float
    incremental_revenue: float


class AgentActivitySummarySchema(BaseModel):
    detection_engine: Dict[str, Any]
    diagnosis_agent: Dict[str, Any]
    recovery_agent: Dict[str, Any]
    policy_engine: Dict[str, Any]


class AuditLogResponse(BaseModel):
    log_id: str
    timestamp: datetime
    event_type: str
    actor: str
    incident_id: Optional[str] = None
    customer_id: Optional[str] = None
    action: str
    reason: Optional[str] = None
    result: str
    amount: Optional[float] = None
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class PolicySchema(BaseModel):
    policy_id: str
    name: str
    value: str
    value_type: str
    description: str
    is_active: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PolicyUpdateSchema(BaseModel):
    value: str
    is_active: Optional[bool] = None
