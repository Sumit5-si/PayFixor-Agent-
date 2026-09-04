from datetime import datetime
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.models import Payment, PaymentStatus


class RevenueRiskCalculator:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_risk_for_segment(
        self,
        payment_method: str,
        bank: str,
        start_time: datetime,
        end_time: datetime
    ) -> float:
        """
        Calculates the total monetary volume of failed transactions
        for the given segment in the specified timeframe.
        """
        stmt = (
            select(func.sum(Payment.amount))
            .where(
                and_(
                    Payment.payment_method == payment_method,
                    Payment.bank == bank,
                    Payment.status == PaymentStatus.FAILED,
                    Payment.timestamp >= start_time,
                    Payment.timestamp <= end_time
                )
            )
        )
        res = await self.db.execute(stmt)
        val = res.scalar_one() or 0.0
        return round(float(val), 2)
