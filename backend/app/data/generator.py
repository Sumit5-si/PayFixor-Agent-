import random
import uuid
import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.database.models import (
    Customer, Payment, PaymentMethod, PaymentStatus, ComplaintStatus
)

BANKS = ["Bank_X", "Bank_Y", "Bank_Z", "Bank_A", "Bank_B"]
PSPS = ["Razorpay", "PayU", "CCAvenue"]

NORMAL_FAILURE_RATES = {
    PaymentMethod.UPI: 0.05,
    PaymentMethod.CARD: 0.03,
    PaymentMethod.NETBANKING: 0.04
}

ERROR_CODES = {
    PaymentMethod.UPI: [
        ("UPI_SYSTEM_TIMEOUT", "Issuer bank timed out during MPIN processing"),
        ("UPI_DECLINED_BY_BANK", "Bank server rejected UPI debit mandate"),
        ("UPI_APP_NOT_RESPONDING", "PSP app did not receive authorization callback"),
        ("INSUFFICIENT_FUNDS", "Customer account has insufficient funds"),
    ],
    PaymentMethod.CARD: [
        ("CARD_3DS_OTP_FAILED", "3D Secure OTP verification timeout or mismatch"),
        ("CARD_GATEWAY_TIMEOUT", "Card processing gateway unresponsive"),
        ("CARD_LIMIT_EXCEEDED", "Daily transaction limit exceeded for card"),
        ("AUTH_FAILED", "Authentication failed on acquiring network"),
    ],
    PaymentMethod.NETBANKING: [
        ("NB_PORTAL_TIMEOUT", "Netbanking portal session expired during authentication"),
        ("NB_BANK_SERVER_BUSY", "Bank core netbanking service unavailable"),
        ("NB_AUTH_DECLINED", "Customer cancelled netbanking auth or invalid token"),
    ]
}

FIRST_NAMES = ["Aarav", "Ananya", "Rohan", "Priya", "Vikram", "Neha", "Rahul", "Sneha", "Karan", "Pooja", "Aditya", "Ishita", "Arjun", "Riya", "Manish", "Divya"]
LAST_NAMES = ["Sharma", "Verma", "Patel", "Reddy", "Mehta", "Nair", "Gupta", "Iyer", "Kumar", "Singh", "Joshi", "Bose", "Choudhury", "Rao"]


class PaymentDataGenerator:
    def __init__(self):
        self.random = random.Random(42)

    def generate_customers(self, count: int = 100) -> List[Customer]:
        customers = []
        for i in range(count):
            first = self.random.choice(FIRST_NAMES)
            last = self.random.choice(LAST_NAMES)
            cust_id = f"CUST_{i+1:05d}"
            email = f"{first.lower()}.{last.lower()}{self.random.randint(10, 999)}@example.com"
            phone = f"+9198{self.random.randint(10000000, 99999999)}"
            customers.append(
                Customer(
                    customer_id=cust_id,
                    name=f"{first} {last}",
                    email=email,
                    phone=phone,
                    total_spend=round(self.random.uniform(500, 50000), 2),
                    failed_attempts_count=0,
                    complaint_status=ComplaintStatus.NORMAL
                )
            )
        return customers

    def generate_payments_batch(
        self,
        customers: List[Customer],
        count: int = 500,
        inject_incident: bool = True,
        incident_method: PaymentMethod = PaymentMethod.UPI,
        incident_bank: str = "Bank_X",
        degradation_failure_rate: float = 0.22,
        start_time: datetime.datetime = None,
        duration_hours: int = 4
    ) -> List[Payment]:
        if start_time is None:
            start_time = datetime.datetime.utcnow() - datetime.timedelta(hours=duration_hours)

        payments = []
        # Pre-generate weights for payment methods: 60% UPI, 25% Card, 15% Netbanking
        methods_pool = [PaymentMethod.UPI] * 60 + [PaymentMethod.CARD] * 25 + [PaymentMethod.NETBANKING] * 15

        for i in range(count):
            customer = self.random.choice(customers)
            method = self.random.choice(methods_pool)
            bank = self.random.choice(BANKS)
            psp = "Razorpay"  # Primary PSP

            # Random timestamp spread within window
            offset_seconds = self.random.randint(0, duration_hours * 3600)
            payment_time = start_time + datetime.timedelta(seconds=offset_seconds)

            # Determine failure probability
            base_prob = NORMAL_FAILURE_RATES.get(method, 0.05)
            
            # Check if this transaction falls in the systemic incident segment
            is_incident_tx = (
                inject_incident and 
                method == incident_method and 
                bank == incident_bank
            )

            actual_failure_prob = degradation_failure_rate if is_incident_tx else base_prob
            # Add small random noise
            is_failed = self.random.random() < actual_failure_prob

            amount = round(self.random.choice([
                self.random.uniform(299, 1499),
                self.random.uniform(1500, 4999),
                self.random.uniform(5000, 9999),
                self.random.uniform(10500, 25000)  # High value portion
            ]), 2)

            payment_id = f"pay_{uuid.uuid4().hex[:14]}"
            order_id = f"order_{uuid.uuid4().hex[:10]}"

            if is_failed:
                status = PaymentStatus.FAILED
                err_choices = ERROR_CODES[method]
                err_code, err_desc = self.random.choice(err_choices)
                if is_incident_tx:
                    # Injected systemic issue has specific concentrated error
                    err_code = f"{method.value}_DECLINED_BY_BANK"
                    err_desc = f"Intermittent service degradation from {incident_bank}"
            else:
                status = PaymentStatus.SUCCESS
                err_code = None
                err_desc = None

            payments.append(
                Payment(
                    payment_id=payment_id,
                    customer_id=customer.customer_id,
                    order_id=order_id,
                    amount=amount,
                    currency="INR",
                    payment_method=method,
                    bank=bank,
                    psp=psp,
                    status=status,
                    error_code=err_code,
                    error_description=err_desc,
                    attempt_number=1,
                    timestamp=payment_time,
                    metadata_json={"simulated": True, "injected_incident": is_incident_tx}
                )
            )

        return payments


async def seed_synthetic_database(
    db: AsyncSession,
    num_customers: int = 150,
    num_payments: int = 600,
    inject_incident: bool = True,
    incident_bank: str = "Bank_X",
    incident_method: PaymentMethod = PaymentMethod.UPI,
    degradation_rate: float = 0.22
) -> Dict[str, Any]:
    generator = PaymentDataGenerator()
    
    # Check if customers already exist
    stmt = select(Customer)
    res = await db.execute(stmt)
    existing_customers = res.scalars().all()
    
    if not existing_customers:
        customers = generator.generate_customers(num_customers)
        db.add_all(customers)
        await db.flush()
    else:
        customers = list(existing_customers)
        
    payments = generator.generate_payments_batch(
        customers=customers,
        count=num_payments,
        inject_incident=inject_incident,
        incident_method=incident_method,
        incident_bank=incident_bank,
        degradation_failure_rate=degradation_rate
    )
    db.add_all(payments)
    await db.commit()
    
    failed_count = sum(1 for p in payments if p.status == PaymentStatus.FAILED)
    return {
        "customers_created_or_used": len(customers),
        "payments_created": len(payments),
        "failed_payments": failed_count,
        "success_payments": len(payments) - failed_count,
        "incident_injected": inject_incident,
        "incident_segment": f"{incident_method.value} + {incident_bank}"
    }
