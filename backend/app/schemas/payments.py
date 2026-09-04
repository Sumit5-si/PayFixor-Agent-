from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.app.database.models import PaymentMethod, PaymentStatus


class CustomerCreate(BaseModel):
    customer_id: str
    name: str
    email: str
    phone: Optional[str] = None


class CustomerResponse(BaseModel):
    customer_id: str
    name: str
    email: str
    phone: Optional[str] = None
    total_spend: float
    failed_attempts_count: int
    complaint_status: str
    escalation_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(BaseModel):
    payment_id: str
    customer_id: str
    order_id: str
    amount: float = Field(gt=0, description="Amount in INR")
    currency: str = "INR"
    payment_method: PaymentMethod
    bank: str
    psp: str = "Razorpay"
    status: PaymentStatus = PaymentStatus.PENDING
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    attempt_number: int = 1
    timestamp: Optional[datetime] = None
    metadata_json: Optional[Dict[str, Any]] = None


class PaymentResponse(BaseModel):
    payment_id: str
    customer_id: str
    order_id: str
    amount: float
    currency: str
    payment_method: str
    bank: str
    psp: str
    status: str
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    attempt_number: int
    timestamp: datetime
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class BatchPaymentIngestRequest(BaseModel):
    payments: List[PaymentCreate]


class SyntheticDataGenerationRequest(BaseModel):
    num_transactions: int = Field(default=500, ge=10, le=10000)
    inject_incident: bool = True
    incident_segment: str = "UPI + Bank_X"
    degradation_multiplier: float = Field(default=4.0, ge=1.5, le=10.0)
    noise_ratio: float = 0.05
