import uuid
import random
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.app.database.models import (
    Incident, IncidentStatus, Customer, Payment, PaymentStatus,
    RecoveryAction, RecoveryStatus, RecoveryStrategy, ExperimentGroup
)
from backend.app.policies.guardrails import PolicyEngine
from backend.app.agents.recovery_agent import RecoveryAgent
from backend.app.razorpay.payment_links import create_recovery_payment_link
from backend.app.evaluation.experiments import ExperimentEngine
from backend.app.services.audit_service import AuditService


class RecoveryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.policy_engine = PolicyEngine(db)
        self.recovery_agent = RecoveryAgent(db)
        self.experiment_engine = ExperimentEngine(db)
        self.audit = AuditService(db)

    async def get_affected_customer_cohort(self, incident: Incident) -> List[Any]:
        """
        Finds all failed transactions matching the incident segment in its timeframe.
        """
        start_time = incident.start_time
        end_time = incident.end_time or datetime.datetime.utcnow()

        stmt = (
            select(Payment, Customer)
            .join(Customer, Payment.customer_id == Customer.customer_id)
            .where(
                and_(
                    Payment.payment_method == incident.payment_method,
                    Payment.bank == incident.bank,
                    Payment.status == PaymentStatus.FAILED,
                    Payment.timestamp >= start_time,
                    Payment.timestamp <= end_time
                )
            )
        )
        res = await self.db.execute(stmt)
        return res.all()

    async def execute_recovery_batch(
        self,
        incident_id: str,
        force_override_policy: bool = False
    ) -> Dict[str, Any]:
        """
        Executes bounded recovery campaign for all eligible affected customers.
        """
        stmt = select(Incident).where(Incident.incident_id == incident_id)
        res = await self.db.execute(stmt)
        incident = res.scalar_one_or_none()
        if not incident:
            return {"error": "Incident not found"}

        if not force_override_policy:
            inc_decision = await self.policy_engine.evaluate_incident_policy(incident)
            if not inc_decision.allowed:
                await self.audit.log_event(
                    event_type="POLICY_CHECK_REJECTED",
                    actor="PolicyEngine",
                    action=f"Blocked recovery batch for incident {incident.incident_id}",
                    result=inc_decision.status,
                    reason=inc_decision.reason,
                    incident_id=incident.incident_id
                )
                return {
                    "incident_id": incident_id,
                    "status": inc_decision.status,
                    "reason": inc_decision.reason,
                    "actions_created": 0
                }

        cohort = await self.get_affected_customer_cohort(incident)
        if not cohort:
            return {
                "incident_id": incident_id,
                "status": "NO_AFFECTED_CUSTOMERS",
                "actions_created": 0
            }

        experiment = await self.experiment_engine.get_or_create_experiment(incident_id)

        created_actions: List[RecoveryAction] = []
        eligible_count = 0
        control_count = 0
        treatment_count = 0
        human_review_count = 0
        stopped_count = 0
        total_recoverable = 0.0

        for payment, customer in cohort:
            cust_decision = await self.policy_engine.evaluate_customer_payment_policy(
                customer, payment, incident
            )

            if not cust_decision.allowed:
                if cust_decision.requires_human_review:
                    human_review_count += 1
                    await self.audit.log_event(
                        event_type="HUMAN_REVIEW_ESCALATION",
                        actor="PolicyEngine",
                        action="Flagged customer payment for manual merchant review",
                        result="HUMAN_REVIEW",
                        reason=cust_decision.reason,
                        incident_id=incident.incident_id,
                        customer_id=customer.customer_id,
                        amount=payment.amount
                    )
                else:
                    stopped_count += 1
                continue

            eligible_count += 1
            total_recoverable += payment.amount

            group = ExperimentGroup.CONTROL if (random.random() < 0.5) else ExperimentGroup.TREATMENT
            if group == ExperimentGroup.CONTROL:
                control_count += 1
            else:
                treatment_count += 1

            ref_id = f"REC_{uuid.uuid4().hex[:10].upper()}"
            plink = create_recovery_payment_link(
                amount=payment.amount,
                customer_name=customer.name,
                customer_email=customer.email,
                customer_phone=customer.phone,
                reference_id=ref_id,
                description=f"PayFixor Recovery - Order {payment.order_id}"
            )

            prep = await self.recovery_agent.prepare_recovery_action(
                customer=customer,
                payment=payment,
                incident=incident,
                group=group,
                payment_link_url=plink.get("short_url", "")
            )

            action = RecoveryAction(
                action_id=f"ACT_{uuid.uuid4().hex[:8].upper()}",
                incident_id=incident.incident_id,
                customer_id=customer.customer_id,
                original_payment_id=payment.payment_id,
                experiment_group=group,
                strategy=prep["strategy"],
                personalized_message=prep["message"],
                payment_link_id=plink.get("id"),
                payment_link_url=plink.get("short_url"),
                amount=payment.amount,
                status=RecoveryStatus.SENT
            )
            self.db.add(action)
            created_actions.append(action)

            await self.audit.log_event(
                event_type="RECOVERY_ACTION_EXECUTED",
                actor="RecoveryAgent",
                action=f"Dispatched {group.value} recovery link via {prep['strategy'].value}",
                result="SENT",
                reason=f"Policy approved. Group: {group.value}",
                incident_id=incident.incident_id,
                customer_id=customer.customer_id,
                amount=payment.amount,
                metadata_json={
                    "payment_link_id": plink.get("id"),
                    "group": group.value
                }
            )

        incident.status = IncidentStatus.RECOVERY_ACTIVE
        await self.db.commit()

        await self.experiment_engine.calculate_experiment_results(incident_id)

        return {
            "incident_id": incident_id,
            "total_affected": len(cohort),
            "eligible_count": eligible_count,
            "control_count": control_count,
            "treatment_count": treatment_count,
            "human_review_count": human_review_count,
            "stopped_count": stopped_count,
            "actions_created": len(created_actions),
            "total_recoverable_amount": round(total_recoverable, 2)
        }
