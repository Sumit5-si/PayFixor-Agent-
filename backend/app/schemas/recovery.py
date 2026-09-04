from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class RecoveryActionResponse(BaseModel):
    action_id: str
    incident_id: str
    customer_id: str
    original_payment_id: Optional[str] = None
    experiment_group: str
    strategy: str
    personalized_message: Optional[str] = None
    payment_link_id: Optional[str] = None
    payment_link_url: Optional[str] = None
    amount: float
    status: str
    stop_reason: Optional[str] = None
    created_at: datetime
    recovered_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TriggerRecoveryBatchRequest(BaseModel):
    incident_id: str
    force_override_policy: bool = False


class RecoveryBatchSummary(BaseModel):
    incident_id: str
    total_affected: int
    eligible_count: int
    control_count: int
    treatment_count: int
    human_review_count: int
    stopped_count: int
    actions_created: int
    total_recoverable_amount: float
