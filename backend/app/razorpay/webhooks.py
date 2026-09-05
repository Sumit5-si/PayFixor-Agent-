import datetime
import logging
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database.models import (
    PaymentEvent, Payment, PaymentMethod, PaymentStatus,
    RecoveryAction, RecoveryStatus, Customer, Incident
)
from backend.app.razorpay.client import razorpay_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper: map Razorpay method string → PaymentMethod enum (with safe fallback)
# ---------------------------------------------------------------------------
def _map_payment_method(method_str: str) -> PaymentMethod:
    method_lower = (method_str or "").lower()
    if method_lower in ("upi", "wallet", "cardless_emi"):
        return PaymentMethod.UPI
    if method_lower in ("card", "emi"):
        return PaymentMethod.CARD
    if method_lower in ("netbanking", "emandate", "nach"):
        return PaymentMethod.NETBANKING
    # Default fallback — UPI is most common in India
    return PaymentMethod.UPI


# ---------------------------------------------------------------------------
# Helper: derive a stable customer_id from Razorpay contact/email
# ---------------------------------------------------------------------------
def _derive_customer_id(contact: str, email: str) -> str:
    raw = (contact or email or "unknown").strip().lower()
    # Remove +91, spaces, make URL-safe
    raw = (
        raw.replace("+91", "")
           .replace(" ", "")
           .replace("@", "_at_")
           .replace(".", "_")
    )
    return f"cust_{raw[:48]}"


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
            logger.warning("Webhook signature verification FAILED — check RAZORPAY_WEBHOOK_SECRET in .env")
            return False, "Invalid webhook signature", {}

        event_id = event_payload.get("id") or f"evt_{datetime.datetime.utcnow().timestamp()}"
        event_type = event_payload.get("event", "unknown")

        logger.info(f"Received Razorpay webhook: event_type={event_type}, event_id={event_id}")

        # 2. Idempotency Check
        stmt = select(PaymentEvent).where(PaymentEvent.event_id == event_id)
        res = await self.db.execute(stmt)
        existing_event = res.scalar_one_or_none()
        if existing_event:
            logger.info(f"Duplicate event skipped: {event_id}")
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
        else:
            logger.info(f"Unhandled event type: {event_type} — stored in events table only")

        event_record.processed = True
        await self.db.commit()

        logger.info(f"Webhook processed successfully: {event_type} → {result_data}")
        return True, f"Successfully processed {event_type}", result_data

    # -----------------------------------------------------------------------
    # Private: ensure Customer exists in DB, create if not
    # -----------------------------------------------------------------------
    async def _ensure_customer(
        self,
        customer_id: str,
        name: str,
        email: str,
        phone: str
    ) -> Customer:
        stmt = select(Customer).where(Customer.customer_id == customer_id)
        res = await self.db.execute(stmt)
        customer = res.scalar_one_or_none()
        if not customer:
            customer = Customer(
                customer_id=customer_id,
                name=name or f"Customer {customer_id[-6:]}",
                email=email or f"{customer_id}@razorpay.com",
                phone=phone or None,
            )
            self.db.add(customer)
            await self.db.flush()
            logger.info(f"Created new customer: {customer_id} (email={email}, phone={phone})")
        return customer

    # -----------------------------------------------------------------------
    # Private: upsert Payment from Razorpay payment entity
    # -----------------------------------------------------------------------
    async def _upsert_payment_from_entity(
        self,
        payment_entity: Dict[str, Any],
        target_status: PaymentStatus
    ) -> Dict[str, Any]:
        """
        Creates a new Payment + Customer from a Razorpay webhook payload if they
        don't already exist. If the payment exists, only updates its status.
        """
        payment_id = payment_entity.get("id")
        if not payment_id:
            logger.warning("Webhook payload missing payment id — skipping")
            return {"status": "no_payment_id"}

        # --- Check if payment already in DB ---
        stmt = select(Payment).where(Payment.payment_id == payment_id)
        res = await self.db.execute(stmt)
        payment = res.scalar_one_or_none()

        if payment:
            # Payment already exists — update status only
            payment.status = target_status
            if target_status == PaymentStatus.FAILED:
                payment.error_code = payment_entity.get("error_code")
                payment.error_description = payment_entity.get("error_description")
            logger.info(f"Updated existing payment {payment_id} → {target_status.value}")
            return {"payment_id": payment_id, "status": target_status.value, "action": "updated"}

        # --- Payment NOT in DB — extract all fields from Razorpay payload ---
        amount_paise = payment_entity.get("amount", 0)
        amount_inr = amount_paise / 100.0

        order_id = payment_entity.get("order_id") or f"order_{payment_id}"
        currency = payment_entity.get("currency", "INR")

        # Method mapping
        method_str = payment_entity.get("method", "")
        payment_method = _map_payment_method(method_str)

        # Bank / issuer extraction (multiple fallback sources from Razorpay payload)
        bank = (
            payment_entity.get("bank")
            or payment_entity.get("issuer")
            or payment_entity.get("wallet")
            # For UPI: extract bank code from VPA (e.g. "user@oksbi" → "oksbi")
            or (payment_entity.get("vpa", "") or "").split("@")[-1]
            or "UNKNOWN_BANK"
        )
        bank = str(bank)[:64]  # Enforce column max length

        # Customer info
        contact = payment_entity.get("contact", "")
        email = payment_entity.get("email", "")
        description = payment_entity.get("description", "")

        # Stable customer_id derived from contact/email
        customer_id = _derive_customer_id(contact, email)

        # Ensure customer exists (create if new)
        await self._ensure_customer(
            customer_id=customer_id,
            name=description or f"Customer {customer_id[-6:]}",
            email=email,
            phone=contact,
        )

        # Error info (only for failed payments)
        error_code = payment_entity.get("error_code")
        error_description = payment_entity.get("error_description")

        # Timestamp: Razorpay provides epoch seconds in created_at field
        created_at_epoch = payment_entity.get("created_at")
        if created_at_epoch:
            try:
                timestamp = datetime.datetime.utcfromtimestamp(int(created_at_epoch))
            except Exception:
                timestamp = datetime.datetime.utcnow()
        else:
            timestamp = datetime.datetime.utcnow()

        new_payment = Payment(
            payment_id=payment_id,
            customer_id=customer_id,
            order_id=order_id,
            amount=amount_inr,
            currency=currency,
            payment_method=payment_method,
            bank=bank,
            psp="Razorpay",
            status=target_status,
            error_code=error_code,
            error_description=error_description,
            attempt_number=1,
            timestamp=timestamp,
            metadata_json={
                "source": "razorpay_webhook",
                "method": method_str,
                "vpa": payment_entity.get("vpa"),
                "contact": contact,
                "email": email,
                "error_source": payment_entity.get("error_source"),
                "error_step": payment_entity.get("error_step"),
                "error_reason": payment_entity.get("error_reason"),
            }
        )
        self.db.add(new_payment)
        await self.db.flush()

        logger.info(
            f"Created new payment {payment_id} | customer={customer_id} | "
            f"amount=₹{amount_inr} | status={target_status.value} | bank={bank}"
        )

        return {
            "payment_id": payment_id,
            "customer_id": customer_id,
            "amount_inr": amount_inr,
            "bank": bank,
            "status": target_status.value,
            "action": "created"
        }

    # -----------------------------------------------------------------------
    # Handler: payment.failed
    # -----------------------------------------------------------------------
    async def _handle_payment_failed(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        return await self._upsert_payment_from_entity(payment_entity, PaymentStatus.FAILED)

    # -----------------------------------------------------------------------
    # Handler: payment.captured / payment.authorized / order.paid
    # -----------------------------------------------------------------------
    async def _handle_payment_success(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        return await self._upsert_payment_from_entity(payment_entity, PaymentStatus.CAPTURED)

    # -----------------------------------------------------------------------
    # Handler: payment_link.paid  (recovery flow — existing logic preserved)
    # -----------------------------------------------------------------------
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

            logger.info(f"Payment link recovered: link_id={link_id}, action_id={action.action_id}, amount=₹{action.amount}")
            return {
                "action_id": action.action_id,
                "incident_id": action.incident_id,
                "amount_recovered": action.amount,
                "status": "RECOVERED"
            }

        logger.warning(f"Payment link paid but no matching RecoveryAction found: link_id={link_id}")
        return {"status": "action_not_found", "link_id": link_id}
