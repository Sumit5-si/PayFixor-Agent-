from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.models import Payment, PaymentStatus


class DataSegmentation:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_segment_metrics(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """
        Groups payments by (payment_method, bank, psp) in the given window
        and computes total transactions, failed transactions, and failure rate.
        """
        stmt = (
            select(
                Payment.payment_method,
                Payment.bank,
                Payment.psp,
                func.count(Payment.payment_id).label("total_tx"),
                func.sum(
                    case(
                        (Payment.status == PaymentStatus.FAILED, 1),
                        else_=0
                    )
                ).label("failed_tx"),
                func.sum(
                    case(
                        (Payment.status == PaymentStatus.FAILED, Payment.amount),
                        else_=0.0
                    )
                ).label("failed_volume")
            )
            .where(
                and_(
                    Payment.timestamp >= start_time,
                    Payment.timestamp <= end_time
                )
            )
            .group_by(Payment.payment_method, Payment.bank, Payment.psp)
        )

        res = await self.db.execute(stmt)
        rows = res.all()

        segments = []
        for row in rows:
            method, bank, psp, total, failed, failed_vol = row
            total = total or 0
            failed = failed or 0
            failed_vol = failed_vol or 0.0
            failure_rate = round(failed / total, 4) if total > 0 else 0.0
            segments.append({
                "payment_method": method.value if hasattr(method, "value") else str(method),
                "bank": bank,
                "psp": psp or "Razorpay",
                "total_tx": total,
                "failed_tx": failed,
                "failed_volume": round(failed_vol, 2),
                "failure_rate": failure_rate,
                "segment_name": f"{method.value if hasattr(method, 'value') else str(method)} + {bank}"
            })

        return segments

    async def get_error_distribution(
        self,
        payment_method: str,
        bank: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """
        Returns the distribution of error codes for a specific segment.
        """
        stmt = (
            select(
                Payment.error_code,
                func.count(Payment.payment_id).label("count")
            )
            .where(
                and_(
                    Payment.timestamp >= start_time,
                    Payment.timestamp <= end_time,
                    Payment.payment_method == payment_method,
                    Payment.bank == bank,
                    Payment.status == PaymentStatus.FAILED
                )
            )
            .group_by(Payment.error_code)
            .order_by(func.count(Payment.payment_id).desc())
        )

        res = await self.db.execute(stmt)
        rows = res.all()

        return [
            {"error_code": row[0] or "UNKNOWN_ERROR", "count": row[1]}
            for row in rows
        ]
