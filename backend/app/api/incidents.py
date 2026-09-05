from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.database.session import get_db
from backend.app.database.models import Incident, IncidentStatus
from backend.app.schemas.incidents import (
    IncidentResponse, IncidentDetailResponse, IncidentStatusUpdate
)
from backend.app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.post("/scan", response_model=List[IncidentResponse])
async def trigger_anomaly_detection_scan(
    lookback_hours: int = Query(default=24, ge=1, le=168),
    min_sample_size: Optional[int] = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers deterministic anomaly detection pipeline across recent transactions.
    """
    service = IncidentService(db)
    incidents = await service.run_detection_pipeline(
        lookback_hours=lookback_hours,
        min_sample_size=min_sample_size
    )
    return incidents


@router.get("/", response_model=List[IncidentResponse])
async def list_incidents(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Incident).order_by(desc(Incident.created_at)).offset(skip).limit(limit)
    if status:
        stmt = stmt.where(Incident.status == status)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{incident_id}", response_model=IncidentDetailResponse)
async def get_incident_details(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Incident)
        .options(selectinload(Incident.evidences))
        .where(Incident.incident_id == incident_id)
    )
    res = await db.execute(stmt)
    incident = res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("/{incident_id}/investigate", response_model=IncidentResponse)
async def trigger_incident_investigation(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually triggers Investigation Agent and AI Diagnosis Agent for an incident.
    """
    service = IncidentService(db)
    incident = await service.process_incident_investigation(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(
    incident_id: str,
    body: IncidentStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    service = IncidentService(db)
    try:
        new_status = IncidentStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid incident status: {body.status}")

    incident = await service.update_incident_status(incident_id, new_status, body.notes)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident
