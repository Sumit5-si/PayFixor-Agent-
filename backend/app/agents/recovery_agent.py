import json
import uuid
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.models import (
    Incident, Customer, Payment, RecoveryStrategy, ExperimentGroup, AgentAction
)
from backend.app.utils.config import settings


RECOVERY_MESSAGE_PROMPT = """
You are PayFixor Recovery Agent.
Generate a concise, courteous, and helpful customer recovery notification for a customer whose transaction recently failed.

Context:
Customer Name: {customer_name}
Amount: INR {amount}
Payment Method Attempted: {payment_method}
Bank: {bank}
Suspected Root Cause: {hypothesis}
Recommended Strategy: {strategy}
Payment Link: {payment_link_url}

CRITICAL RULES:
1. Do NOT invent discounts, coupons, promo codes, or altered prices.
2. Be transparent that there was an issue with the specific bank/method channel.
3. Suggest the recommended alternative (e.g. using Card, Netbanking, or another UPI handle) politely.
4. Keep the message under 60 words, ideal for SMS / WhatsApp / Email.

Output ONLY JSON in this format:
{{
  "message": "Hi Aarav, we noticed your INR 2,499 payment via Bank_X UPI could not be processed due to intermittent bank switch delays. To complete your order seamlessly, please use our secure Razorpay link to pay via Card or Netbanking: https://rzp.io/i/..."
}}
"""


class RecoveryAgent:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _generate_treatment_message(
        self,
        customer: Customer,
        payment: Payment,
        incident: Incident,
        payment_link_url: str
    ) -> str:
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                from google.genai import types
                
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = RECOVERY_MESSAGE_PROMPT.format(
                    customer_name=customer.name,
                    amount=payment.amount,
                    payment_method=payment.payment_method.value if hasattr(payment.payment_method, "value") else str(payment.payment_method),
                    bank=payment.bank,
                    hypothesis=incident.hypothesis or "Temporary bank payment gateway degradation",
                    strategy=incident.recommended_strategy or "ALTERNATIVE_PAYMENT_METHOD",
                    payment_link_url=payment_link_url
                )
                
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                parsed = json.loads(response.text)
                if "message" in parsed:
                    return parsed["message"]
            except Exception:
                pass

        method_str = payment.payment_method.value if hasattr(payment.payment_method, "value") else str(payment.payment_method)
        return (
            f"Hi {customer.name}, we noticed your ₹{payment.amount:,.2f} order via {payment.bank} {method_str} failed "
            f"due to temporary bank gateway delays. To complete your purchase safely, please retry using an alternative method: {payment_link_url}"
        )

    def _generate_control_message(
        self,
        customer: Customer,
        payment: Payment,
        payment_link_url: str
    ) -> str:
        """
        Generic baseline recovery message for control group.
        """
        return f"Hi {customer.name}, your payment of ₹{payment.amount:,.2f} could not be processed. Please click here to complete your order: {payment_link_url}"

    async def prepare_recovery_action(
        self,
        customer: Customer,
        payment: Payment,
        incident: Incident,
        group: ExperimentGroup,
        payment_link_url: str
    ) -> Dict[str, Any]:
        """
        Builds strategy and personalized message depending on control/treatment cohort.
        """
        strategy = RecoveryStrategy.ALTERNATIVE_PAYMENT_METHOD
        if incident.recommended_strategy == "RETRY_RECOMMENDATION":
            strategy = RecoveryStrategy.RETRY_RECOMMENDATION
        elif incident.recommended_strategy == "RAZORPAY_PAYMENT_LINK":
            strategy = RecoveryStrategy.RAZORPAY_PAYMENT_LINK

        if group == ExperimentGroup.TREATMENT:
            message = await self._generate_treatment_message(
                customer, payment, incident, payment_link_url
            )
        else:
            message = self._generate_control_message(
                customer, payment, payment_link_url
            )

        action_log = AgentAction(
            action_id=f"ACT_{uuid.uuid4().hex[:8].upper()}",
            agent_name="RecoveryAgent",
            incident_id=incident.incident_id,
            input_json={
                "customer_id": customer.customer_id,
                "amount": payment.amount,
                "group": group.value,
                "strategy": strategy.value
            },
            output_json={"message": message, "strategy": strategy.value}
        )
        self.db.add(action_log)
        await self.db.commit()

        return {
            "strategy": strategy,
            "message": message,
            "group": group
        }
