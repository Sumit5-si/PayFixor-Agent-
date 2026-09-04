import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    String, Float, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import enum


class Base(DeclarativeBase):
    pass


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    AUTHORIZED = "AUTHORIZED"
    CAPTURED = "CAPTURED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, enum.Enum):
    UPI = "UPI"
    CARD = "CARD"
    NETBANKING = "NETBANKING"


class IncidentStatus(str, enum.Enum):
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    CONFIRMED = "CONFIRMED"
    RECOVERY_ACTIVE = "RECOVERY_ACTIVE"
    MONITORING = "MONITORING"
    RESOLVED = "RESOLVED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    HUMAN_REVIEW = "HUMAN_REVIEW"


class RecoveryStatus(str, enum.Enum):
    INITIATED = "INITIATED"
    LINK_CREATED = "LINK_CREATED"
    SENT = "SENT"
    RECOVERED = "RECOVERED"
    EXPIRED = "EXPIRED"
    FAILED = "FAILED"
    STOPPED = "STOPPED"
    ESCALATED = "ESCALATED"


class RecoveryStrategy(str, enum.Enum):
    RETRY_RECOMMENDATION = "RETRY_RECOMMENDATION"
    ALTERNATIVE_PAYMENT_METHOD = "ALTERNATIVE_PAYMENT_METHOD"
    RAZORPAY_PAYMENT_LINK = "RAZORPAY_PAYMENT_LINK"
    PERSONALIZED_MESSAGE = "PERSONALIZED_MESSAGE"


class ExperimentGroup(str, enum.Enum):
    CONTROL = "CONTROL"
    TREATMENT = "TREATMENT"


class ComplaintStatus(str, enum.Enum):
    NORMAL = "NORMAL"
    COMPLAINT = "COMPLAINT"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    HIGH_VALUE_REVIEW = "HIGH_VALUE_REVIEW"


class Customer(Base):
    __tablename__ = "customers"

    customer_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    email: Mapped[str] = mapped_column(String(128), index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    total_spend: Mapped[float] = mapped_column(Float, default=0.0)
    failed_attempts_count: Mapped[int] = mapped_column(Integer, default=0)
    complaint_status: Mapped[ComplaintStatus] = mapped_column(
        SQLEnum(ComplaintStatus), default=ComplaintStatus.NORMAL
    )
    escalation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="customer")
    recovery_actions: Mapped[List["RecoveryAction"]] = relationship("RecoveryAction", back_populates="customer")


class Payment(Base):
    __tablename__ = "payments"

    payment_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.customer_id"), index=True)
    order_id: Mapped[str] = mapped_column(String(64), index=True)
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    payment_method: Mapped[PaymentMethod] = mapped_column(SQLEnum(PaymentMethod), index=True)
    bank: Mapped[str] = mapped_column(String(64), index=True)
    psp: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus), index=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    error_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="payments")
    events: Mapped[List["PaymentEvent"]] = relationship("PaymentEvent", back_populates="payment")

    __table_args__ = (
        Index("ix_payment_method_bank_timestamp", "payment_method", "bank", "timestamp"),
    )


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    event_id: Mapped[str] = mapped_column(String(128), primary_key=True, index=True)
    payment_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("payments.payment_id"), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    source: Mapped[str] = mapped_column(String(64), default="razorpay")
    raw_payload: Mapped[Dict[str, Any]] = mapped_column(JSON)
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    received_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )

    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="events")


class Incident(Base):
    __tablename__ = "incidents"

    incident_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    segment: Mapped[str] = mapped_column(String(128), index=True)  # e.g., "UPI + Bank_X"
    payment_method: Mapped[str] = mapped_column(String(32))
    bank: Mapped[str] = mapped_column(String(64))
    psp: Mapped[Optional[str]] = mapped_column(String(64), default="Razorpay")
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    
    baseline_rate: Mapped[float] = mapped_column(Float)
    current_rate: Mapped[float] = mapped_column(Float)
    anomaly_ratio: Mapped[float] = mapped_column(Float)
    sample_size: Mapped[int] = mapped_column(Integer)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    revenue_at_risk: Mapped[float] = mapped_column(Float, default=0.0)
    recovered_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    
    status: Mapped[IncidentStatus] = mapped_column(
        SQLEnum(IncidentStatus), default=IncidentStatus.DETECTED, index=True
    )
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hypothesis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    supporting_evidence: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    unknowns: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    recommended_strategy: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    evidences: Mapped[List["IncidentEvidence"]] = relationship("IncidentEvidence", back_populates="incident")
    recovery_actions: Mapped[List["RecoveryAction"]] = relationship("RecoveryAction", back_populates="incident")
    experiments: Mapped[List["Experiment"]] = relationship("Experiment", back_populates="incident")


class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"

    evidence_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.incident_id"), index=True)
    evidence_type: Mapped[str] = mapped_column(String(64))  # e.g., "bank_comparison", "time_series", "error_dist"
    data_json: Mapped[Dict[str, Any]] = mapped_column(JSON)
    collected_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    incident: Mapped["Incident"] = relationship("Incident", back_populates="evidences")


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    action_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.incident_id"), index=True)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.customer_id"), index=True)
    original_payment_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    experiment_group: Mapped[ExperimentGroup] = mapped_column(
        SQLEnum(ExperimentGroup), default=ExperimentGroup.TREATMENT
    )
    strategy: Mapped[RecoveryStrategy] = mapped_column(SQLEnum(RecoveryStrategy))
    personalized_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_link_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    payment_link_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    amount: Mapped[float] = mapped_column(Float)
    status: Mapped[RecoveryStatus] = mapped_column(
        SQLEnum(RecoveryStatus), default=RecoveryStatus.INITIATED, index=True
    )
    stop_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )
    recovered_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="recovery_actions")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="recovery_actions")


class Experiment(Base):
    __tablename__ = "experiments"

    experiment_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.incident_id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    control_count: Mapped[int] = mapped_column(Integer, default=0)
    treatment_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    incident: Mapped["Incident"] = relationship("Incident", back_populates="experiments")
    results: Mapped[List["ExperimentResult"]] = relationship("ExperimentResult", back_populates="experiment")


class ExperimentResult(Base):
    __tablename__ = "experiment_results"

    result_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    experiment_id: Mapped[str] = mapped_column(String(64), ForeignKey("experiments.experiment_id"), index=True)
    group: Mapped[ExperimentGroup] = mapped_column(SQLEnum(ExperimentGroup))
    targeted_count: Mapped[int] = mapped_column(Integer, default=0)
    recovered_count: Mapped[int] = mapped_column(Integer, default=0)
    targeted_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    recovered_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    recovery_rate: Mapped[float] = mapped_column(Float, default=0.0)
    relative_lift: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    incremental_revenue: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    computed_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    experiment: Mapped["Experiment"] = relationship("Experiment", back_populates="results")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    actor: Mapped[str] = mapped_column(String(64), index=True)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    customer_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(128))
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result: Mapped[str] = mapped_column(String(64))  # SUCCESS, FAILED, STOPPED, ESCALATED, etc.
    amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)


class AgentAction(Base):
    __tablename__ = "agent_actions"

    action_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    agent_name: Mapped[str] = mapped_column(String(64), index=True)  # Investigation, Diagnosis, Recovery
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    input_json: Mapped[Dict[str, Any]] = mapped_column(JSON)
    output_json: Mapped[Dict[str, Any]] = mapped_column(JSON)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )


class Policy(Base):
    __tablename__ = "policies"

    policy_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    value: Mapped[str] = mapped_column(String(256))
    value_type: Mapped[str] = mapped_column(String(32), default="string")  # int, float, bool, string
    description: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )
