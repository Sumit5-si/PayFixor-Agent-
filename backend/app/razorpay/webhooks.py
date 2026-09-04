import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database.models import (
    PaymentEvent, Payment, RecoveryAction, RecoveryStatus, PaymentStatus, Incident
)
from backend.app.razorpay.client import razorpay_service


class WebhookHandler:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_webhook_event(
        self,
        event_payload: Dict[str, Any],
        raw_body: str,
        signature: str
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates signature, checks idempotency, and routes event to specific handler.
        Returns (success, message, result_data)
        """
        # 1. Signature Verification
        if not razorpay_service.verify_webhook_signature(raw_body, signature):
            return False, "Invalid webhook signature", {}

        event_id = event_payload.get("id") or f"evt_{datetime.datetime.utcnow().timestamp()}"
        event_type = event_payload.get("event", "unknown")

        # 2. Idempotency Check
        stmt = select(PaymentEvent).where(PaymentEvent.event_id == event_id)
        res = await self.db.execute(stmt)
        existing_event = res.scalar_one_or_none()
        if existing_event:
            return True, "Event already processed (Idempotent)", {"event_id": event_id, "status": "duplicate"}

        # Store raw event
        event_record = PaymentEvent(
            event_id=event_id,
            event_type=event_type,
            source="razorpay",
            raw_payload=event_payload,
            processed=False
        )
        self.db.add(event_record)
        await self.db.flush()

        # 3. Route Event
        result_data = {}
        if event_type == "payment_link.paid":
            result_data = await self._handle_payment_link_paid(event_payload)
        elif event_type in ("payment.captured", "payment.authorized", "order.paid"):
            result_data = await self._handle_payment_success(event_payload)
        elif event_type == "payment.failed":
            result_data = await self._handle_payment_failed(event_payload)

        event_record.processed = True
        await self.db.commit()

        return True, f"Successfully processed {event_type}", result_data

    async def _handle_payment_link_paid(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes payment_link.paid webhook event to record successful revenue recovery.
        """
        plink_entity = payload.get("payload", {}).get("payment_link", {}).get("entity", {})
        link_id = plink_entity.get("id")
        amount_paid = plink_entity.get("amount_paid", 0) / 100.0  # paise to INR

        if not link_id:
            return {"status": "no_link_id"}

        stmt = select(RecoveryAction).where(RecoveryAction.payment_link_id == link_id)
        res = await self.db.execute(stmt)
        action = res.scalar_one_or_none()

        if action:
            action.status = RecoveryStatus.RECOVERED
            action.recovered_at = datetime.datetime.utcnow()
            
            # Update incident recovered revenue
            incident_stmt = select(Incident).where(Incident.incident_id == action.incident_id)
            inc_res = await self.db.execute(incident_stmt)
            incident = inc_res.scalar_one_or_none()
            if incident:
                incident.recovered_revenue = round(incident.recovered_revenue + action.amount, 2)

            return {
                "action_id": action.action_id,
                "incident_id": action.incident_id,
                "amount_recovered": action.amount,
                "status": "RECOVERED"
            }

        return {"status": "action_not_found", "link_id": link_id}

    async def _handle_payment_success(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment_entity.get("id")
        if payment_id:
            stmt = select(Payment).where(Payment.payment_id == payment_id)
            res = await self.db.execute(stmt)
            payment = res.scalar_one_or_none()
            if payment:
                payment.status = PaymentStatus.CAPTURED
                return {"payment_id": payment_id, "status": "CAPTURED"}
        return {"status": "success_recorded"}

    async def _handle_payment_failed(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment_entity.get("id")
        if payment_id:
            stmt = select(Payment).where(Payment.payment_id == payment_id)
            res = await self.db.execute(stmt)
            payment = res.scalar_one_or_none()
            if payment:
                payment.status = PaymentStatus.FAILED
                payment.error_code = payment_entity.get("error_code")
                payment.error_description = payment_entity.get("error_description")
                return {"payment_id": payment_id, "status": "FAILED"}
        return {"status": "failure_recorded"}
