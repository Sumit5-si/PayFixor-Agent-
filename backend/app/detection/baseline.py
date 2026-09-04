from typing import Dict, Tuple, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.models import Payment, PaymentStatus, PaymentMethod


DEFAULT_BASELINES = {
    "UPI": 0.051,
    "CARD": 0.032,
    "NETBANKING": 0.041
}


class BaselineCalculator:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_segment_baseline(
        self,
        payment_method: str,
        bank: Optional[str] = None,
        reference_time: Optional[datetime] = None,
        lookback_days: int = 7
    ) -> Tuple[float, int]:
        """
        Calculates the historical baseline failure rate for a given segment.
        Returns (baseline_rate, sample_size)
        """
        if reference_time is None:
            reference_time = datetime.utcnow()
            
        start_lookback = reference_time - timedelta(days=lookback_days)
        end_lookback = reference_time - timedelta(hours=4)

        conditions = [
            Payment.timestamp >= start_lookback,
            Payment.timestamp <= end_lookback,
            Payment.payment_method == payment_method
        ]
        if bank:
            conditions.append(Payment.bank == bank)

        total_stmt = select(func.count(Payment.payment_id)).where(and_(*conditions))
        total_res = await self.db.execute(total_stmt)
        total_count = total_res.scalar_one() or 0

        if total_count < 30:
            # Fall back to method-level default baseline if insufficient historical records
            return DEFAULT_BASELINES.get(payment_method.upper(), 0.05), total_count

        failed_conditions = conditions + [Payment.status == PaymentStatus.FAILED]
        failed_stmt = select(func.count(Payment.payment_id)).where(and_(*failed_conditions))
        failed_res = await self.db.execute(failed_stmt)
        failed_count = failed_res.scalar_one() or 0

        baseline_rate = failed_count / total_count if total_count > 0 else 0.05
        return round(baseline_rate, 4), total_count
