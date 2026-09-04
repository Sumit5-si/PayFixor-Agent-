from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.database.session import get_db
from backend.app.database.models import AuditLog, Policy
from backend.app.schemas.analytics import (
    OverviewKPISchema, AgentActivitySummarySchema, AuditLogResponse,
    PolicySchema, PolicyUpdateSchema
)
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=OverviewKPISchema)
async def get_overview_kpis(db: AsyncSession = Depends(get_db)):
    service = AnalyticsService(db)
    return await service.get_overview_kpis()


@router.get("/agent-activity", response_model=AgentActivitySummarySchema)
async def get_agent_activity(db: AsyncSession = Depends(get_db)):
    service = AnalyticsService(db)
    return await service.get_agent_activity_summary()


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    incident_id: Optional[str] = None,
    actor: Optional[str] = None,
    event_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit)
    if incident_id:
        stmt = stmt.where(AuditLog.incident_id == incident_id)
    if actor:
        stmt = stmt.where(AuditLog.actor == actor)
    if event_type:
        stmt = stmt.where(AuditLog.event_type == event_type)

    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/policies", response_model=List[PolicySchema])
async def list_policies(db: AsyncSession = Depends(get_db)):
    stmt = select(Policy).order_by(Policy.name)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.patch("/policies/{name}", response_model=PolicySchema)
async def update_policy(
    name: str,
    update: PolicyUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Policy).where(Policy.name == name)
    res = await db.execute(stmt)
    policy = res.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy {name} not found")

    policy.value = update.value
    if update.is_active is not None:
        policy.is_active = update.is_active
    await db.commit()
    await db.refresh(policy)
    return policy
