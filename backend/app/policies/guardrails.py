from typing import Dict, Any, Optional, Tuple
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database.models import (
    Customer, Payment, Incident, IncidentStatus, ComplaintStatus, RecoveryAction, Policy
)
from backend.app.utils.config import settings


class PolicyDecision(BaseModel):
    allowed: bool
    status: str  # "APPROVED", "REJECTED", "HUMAN_REVIEW", "STOPPED"
    rule_name: str
    reason: str
    requires_human_review: bool = False


class PolicyEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_policy_value(self, name: str, default: Any) -> Any:
        stmt = select(Policy).where(Policy.name == name, Policy.is_active == True)
        res = await self.db.execute(stmt)
        policy = res.scalar_one_or_none()
        if not policy:
            return default
        try:
            if policy.value_type == "int":
                return int(policy.value)
            elif policy.value_type == "float":
                return float(policy.value)
            elif policy.value_type == "bool":
                return policy.value.lower() in ("true", "1", "yes")
            return policy.value
        except Exception:
            return default

    async def evaluate_incident_policy(self, incident: Incident) -> PolicyDecision:
        """
        Evaluates incident-level policies before initiating recovery campaigns.
        """
        stop_if_resolved = await self.get_policy_value("STOP_IF_INCIDENT_RESOLVED", True)
        if stop_if_resolved and incident.status == IncidentStatus.RESOLVED:
            return PolicyDecision(
                allowed=False,
                status="STOPPED",
                rule_name="STOP_IF_INCIDENT_RESOLVED",
                reason="Incident is already RESOLVED. Automated recovery stopped."
            )

        min_confidence = await self.get_policy_value("MIN_DIAGNOSIS_CONFIDENCE", settings.MIN_CONFIDENCE_THRESHOLD)
        if incident.confidence is not None and incident.confidence < min_confidence:
            return PolicyDecision(
                allowed=False,
                status="STOPPED",
                rule_name="MIN_DIAGNOSIS_CONFIDENCE",
                reason=f"Diagnosis confidence ({incident.confidence:.2f}) is below minimum threshold ({min_confidence:.2f}). Insufficient evidence for automated recovery."
            )

        if incident.status == IncidentStatus.INSUFFICIENT_EVIDENCE:
            return PolicyDecision(
                allowed=False,
                status="STOPPED",
                rule_name="INSUFFICIENT_EVIDENCE_POLICY",
                reason="Incident marked as INSUFFICIENT_EVIDENCE. Automated root-cause actions prohibited."
            )

        if incident.status == IncidentStatus.HUMAN_REVIEW:
            return PolicyDecision(
                allowed=False,
                status="HUMAN_REVIEW",
                rule_name="INCIDENT_HUMAN_REVIEW",
                reason="Incident flagged for manual merchant review prior to recovery action.",
                requires_human_review=True
            )

        return PolicyDecision(
            allowed=True,
            status="APPROVED",
            rule_name="INCIDENT_POLICY_CHECK",
            reason="Incident satisfies all recovery policy prerequisites."
        )

    async def evaluate_customer_payment_policy(
        self,
        customer: Customer,
        payment: Payment,
        incident: Incident
    ) -> PolicyDecision:
        """
        Evaluates customer-level guardrails before creating a recovery action.
        """
        if customer.complaint_status in (ComplaintStatus.COMPLAINT, ComplaintStatus.ESCALATED):
            return PolicyDecision(
                allowed=False,
                status="HUMAN_REVIEW",
                rule_name="CUSTOMER_COMPLAINT_GUARDRAIL",
                reason=f"Customer has active {customer.complaint_status.value} status. Bypassing automated recovery.",
                requires_human_review=True
            )

        high_value_thresh = await self.get_policy_value("HIGH_VALUE_THRESHOLD", settings.HIGH_VALUE_THRESHOLD)
        if payment.amount >= high_value_thresh:
            return PolicyDecision(
                allowed=False,
                status="HUMAN_REVIEW",
                rule_name="HIGH_VALUE_TRANSACTION_THRESHOLD",
                reason=f"Transaction amount (₹{payment.amount:,.2f}) meets or exceeds high-value threshold (₹{high_value_thresh:,.2f}). Requires merchant review.",
                requires_human_review=True
            )

        max_customer_attempts = await self.get_policy_value("MAX_CUSTOMER_RECOVERY_ATTEMPTS", settings.MAX_CUSTOMER_RECOVERY_ATTEMPTS)
        cust_attempts = customer.failed_attempts_count if customer.failed_attempts_count is not None else 0
        if cust_attempts >= max_customer_attempts:
            return PolicyDecision(
                allowed=False,
                status="HUMAN_REVIEW",
                rule_name="MAX_CUSTOMER_RECOVERY_ATTEMPTS",
                reason=f"Customer has {cust_attempts} failed attempts (limit: {max_customer_attempts}). Escalated to prevent spam.",
                requires_human_review=True
            )

        dup_protection = await self.get_policy_value("DUPLICATE_CAMPAIGN_PROTECTION", True)
        if dup_protection:
            stmt = select(RecoveryAction).where(
                RecoveryAction.original_payment_id == payment.payment_id
            )
            res = await self.db.execute(stmt)
            existing_action = res.scalar_one_or_none()
            if existing_action:
                return PolicyDecision(
                    allowed=False,
                    status="STOPPED",
                    rule_name="DUPLICATE_CAMPAIGN_PROTECTION",
                    reason=f"Payment {payment.payment_id} already has an existing recovery action ({existing_action.action_id}). Duplicate campaign prevented."
                )

        max_auto_attempts = await self.get_policy_value("MAX_AUTO_RECOVERY_ATTEMPTS", settings.MAX_AUTO_RECOVERY_ATTEMPTS)
        payment_attempts = payment.attempt_number if payment.attempt_number is not None else 1
        if payment_attempts > max_auto_attempts:
            return PolicyDecision(
                allowed=False,
                status="STOPPED",
                rule_name="MAX_AUTO_RECOVERY_ATTEMPTS",
                reason=f"Payment attempt number ({payment_attempts}) exceeds allowed auto-recovery attempts ({max_auto_attempts})."
            )

        return PolicyDecision(
            allowed=True,
            status="APPROVED",
            rule_name="CUSTOMER_POLICY_CHECK",
            reason="Customer payment satisfies all recovery safety policies."
        )
