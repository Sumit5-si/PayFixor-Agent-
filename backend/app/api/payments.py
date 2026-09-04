from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.database.session import get_db
from backend.app.database.models import Payment, Customer, ComplaintStatus
from backend.app.schemas.payments import (
    PaymentCreate, PaymentResponse, CustomerResponse,
    SyntheticDataGenerationRequest
)
from backend.app.data.generator import seed_synthetic_database

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/seed-synthetic")
async def seed_synthetic_data(
    req: SyntheticDataGenerationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates realistic synthetic payments and optionally injects a systemic failure pattern.
    """
    bank = "Bank_X"
    if "Bank_" in req.incident_segment:
        parts = req.incident_segment.split("+")
        if len(parts) > 1:
            bank = parts[1].strip()

    result = await seed_synthetic_database(
        db=db,
        num_customers=max(50, req.num_transactions // 4),
        num_payments=req.num_transactions,
        inject_incident=req.inject_incident,
        incident_bank=bank,
        degradation_rate=min(0.50, 0.05 * req.degradation_multiplier)
    )
    return {
        "status": "success",
        "message": f"Successfully generated {result['payments_created']} synthetic transactions",
        "details": result
    }


@router.post("/ingest", response_model=PaymentResponse)
async def ingest_single_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests a live payment event from ecommerce platform or gateway.
    """
    stmt = select(Customer).where(Customer.customer_id == payment_in.customer_id)
    res = await db.execute(stmt)
    customer = res.scalar_one_or_none()
    
    if not customer:
        customer = Customer(
            customer_id=payment_in.customer_id,
            name=f"Customer {payment_in.customer_id[-4:]}",
            email=f"{payment_in.customer_id.lower()}@example.com"
        )
        db.add(customer)

    payment = Payment(
        payment_id=payment_in.payment_id,
        customer_id=payment_in.customer_id,
        order_id=payment_in.order_id,
        amount=payment_in.amount,
        currency=payment_in.currency,
        payment_method=payment_in.payment_method,
        bank=payment_in.bank,
        psp=payment_in.psp,
        status=payment_in.status,
        error_code=payment_in.error_code,
        error_description=payment_in.error_description,
        attempt_number=payment_in.attempt_number,
        timestamp=payment_in.timestamp or payment.timestamp,
        metadata_json=payment_in.metadata_json
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    bank: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Payment).order_by(desc(Payment.timestamp)).offset(skip).limit(limit)
    if status:
        stmt = stmt.where(Payment.status == status)
    if payment_method:
        stmt = stmt.where(Payment.payment_method == payment_method)
    if bank:
        stmt = stmt.where(Payment.bank == bank)

    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    complaint_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Customer).offset(skip).limit(limit)
    if complaint_status:
        stmt = stmt.where(Customer.complaint_status == complaint_status)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.patch("/customers/{customer_id}/status")
async def update_customer_complaint_status(
    customer_id: str,
    status: ComplaintStatus,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Customer).where(Customer.customer_id == customer_id)
    res = await db.execute(stmt)
    customer = res.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.complaint_status = status
    if reason:
        customer.escalation_reason = reason
    await db.commit()
    return {"status": "success", "customer_id": customer_id, "complaint_status": status.value}
