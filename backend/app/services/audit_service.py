import uuid
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.models import AuditLog


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        event_type: str,
        actor: str,
        action: str,
        result: str,
        reason: Optional[str] = None,
        incident_id: Optional[str] = None,
        customer_id: Optional[str] = None,
        amount: Optional[float] = None,
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Creates an immutable audit log record.
        """
        log = AuditLog(
            log_id=f"LOG_{uuid.uuid4().hex[:10].upper()}",
            timestamp=datetime.datetime.utcnow(),
            event_type=event_type,
            actor=actor,
            incident_id=incident_id,
            customer_id=customer_id,
            action=action,
            reason=reason,
            result=result,
            amount=amount,
            metadata_json=metadata_json
        )
        self.db.add(log)
        await self.db.commit()
        return log
