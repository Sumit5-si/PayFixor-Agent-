from typing import Dict, Any, Optional
from backend.app.razorpay.client import razorpay_service


def create_recovery_payment_link(
    amount: float,
    customer_name: str,
    customer_email: str,
    customer_phone: Optional[str],
    reference_id: str,
    description: str = "PayFixor Revenue Recovery"
) -> Dict[str, Any]:
    return razorpay_service.create_payment_link(
        amount=amount,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        description=description,
        reference_id=reference_id
    )


def get_recovery_payment_link(link_id: str) -> Dict[str, Any]:
    return razorpay_service.fetch_payment_link(link_id)
