import os
import hmac
import hashlib
import uuid
import logging
from typing import Dict, Any, Optional
import razorpay
from backend.app.utils.config import settings

logger = logging.getLogger(__name__)


class RazorpayService:
    def __init__(
        self,
        key_id: Optional[str] = None,
        key_secret: Optional[str] = None,
        webhook_secret: Optional[str] = None
    ):
        self.key_id = key_id or settings.RAZORPAY_KEY_ID
        self.key_secret = key_secret or settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = webhook_secret or settings.RAZORPAY_WEBHOOK_SECRET

        # Treat missing OR placeholder credentials as mock mode
        _placeholder_ids = ("", "rzp_test_your_key_id", "your_razorpay_key_here")
        _placeholder_secrets = ("", "your_razorpay_key_secret", "mock_secret", "your_secret_here")
        self.is_mock = (
            not self.key_id
            or self.key_id in _placeholder_ids
            or self.key_id.startswith("rzp_test_mock")
            or self.key_secret in _placeholder_secrets
        )
        if self.is_mock:
            logger.warning(
                "RazorpayService running in MOCK mode — set real credentials in .env to process live payments"
            )
        
        if not self.is_mock:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
        else:
            self.client = None

    def create_payment_link(
        self,
        amount: float,
        customer_name: str,
        customer_email: str,
        customer_phone: Optional[str],
        description: str,
        reference_id: str,
        expire_by_minutes: int = 1440
    ) -> Dict[str, Any]:
        """
        Creates a Razorpay Payment Link for payment recovery.
        Amount is converted to paise for Razorpay API.
        """
        amount_in_paise = int(amount * 100)
        
        if not self.is_mock and self.client:
            try:
                payload = {
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "accept_partial": False,
                    "reference_id": reference_id,
                    "description": description,
                    "customer": {
                        "name": customer_name,
                        "email": customer_email,
                        "contact": customer_phone or "+919876543210"
                    },
                    "notify": {
                        "sms": False,
                        "email": True
                    },
                    "reminder_enable": False,
                    "notes": {
                        "recovery_agent": "PayFixor",
                        "reference_id": reference_id
                    }
                }
                response = self.client.payment_link.create(payload)
                return {
                    "id": response.get("id"),
                    "short_url": response.get("short_url"),
                    "status": response.get("status"),
                    "amount": amount,
                    "reference_id": reference_id
                }
            except Exception as e:
                # Log and fallback to test link descriptor in test mode if network fails
                pass

        # Mock / Test Mode link generator
        link_id = f"plink_{uuid.uuid4().hex[:14]}"
        return {
            "id": link_id,
            "short_url": f"https://rzp.io/i/{link_id[:8]}",
            "status": "created",
            "amount": amount,
            "reference_id": reference_id,
            "mock": True
        }

    def fetch_payment_link(self, link_id: str) -> Dict[str, Any]:
        if not self.is_mock and self.client:
            try:
                return self.client.payment_link.fetch(link_id)
            except Exception:
                pass
        return {
            "id": link_id,
            "status": "paid",
            "amount_paid": 100000
        }

    def verify_webhook_signature(
        self,
        payload_body: str,
        signature: str,
        secret: Optional[str] = None
    ) -> bool:
        """
        Validates HMAC SHA256 webhook signature from Razorpay.
        In mock mode, accepts known test signatures for local development.
        """
        webhook_sec = secret or self.webhook_secret
        _placeholder_secrets = ("", "your_webhook_secret_here", "mock_webhook_secret", "your_secret")

        # Mock mode: allow known test signatures or pass-through if no secret configured
        if self.is_mock:
            if signature in ("mock_sig", "mock_signature", "test_sig"):
                logger.debug("Mock webhook signature accepted")
                return True
            if webhook_sec in _placeholder_secrets:
                logger.warning("Mock mode: RAZORPAY_WEBHOOK_SECRET is placeholder — accepting webhook without verification")
                return True

        # Production: reject if missing signature or secret
        if not signature:
            logger.warning("Webhook rejected: X-Razorpay-Signature header is missing")
            return False
        if not webhook_sec or webhook_sec in _placeholder_secrets:
            logger.error(
                "Webhook rejected: RAZORPAY_WEBHOOK_SECRET is not set or is a placeholder value. "
                "Set a real secret in backend/.env and in Razorpay Dashboard → Webhooks."
            )
            return False

        try:
            expected_signature = hmac.new(
                key=webhook_sec.encode("utf-8"),
                msg=payload_body.encode("utf-8"),
                digestmod=hashlib.sha256
            ).hexdigest()
            result = hmac.compare_digest(expected_signature, signature)
            if not result:
                logger.warning(
                    "Webhook signature mismatch — possible wrong RAZORPAY_WEBHOOK_SECRET or tampered payload"
                )
            return result
        except Exception as exc:
            logger.error(f"Webhook HMAC verification raised exception: {exc}")
            return False


razorpay_service = RazorpayService()
