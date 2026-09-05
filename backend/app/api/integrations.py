import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, String

from backend.app.database.session import get_db
from backend.app.database.models import Payment, Customer
from backend.app.integrations.google_sheets import GoogleSheetsSyncService
from backend.app.utils.config import settings

router = APIRouter(prefix="/integrations", tags=["Integrations"])


class SheetSyncRequest(BaseModel):
    sheet_id: Optional[str] = None
    sheet_url: Optional[str] = None


class CsvImportRequest(BaseModel):
    csv_content: str


class SheetWebhookPayload(BaseModel):
    order_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    product_id: Optional[str] = None
    quantity: Optional[str] = None
    amount: Optional[float] = 0.0
    status: Optional[str] = "CONFIRMED"
    timestamp: Optional[str] = None


@router.get("/sheets/status")
async def get_sheet_status(db: AsyncSession = Depends(get_db)):
    """
    Returns Google Sheets integration configuration and ingested statistics.
    """
    stmt = select(func.count(Payment.payment_id)).where(
        cast(Payment.metadata_json, String).like("%google_spreadsheet%")
    )
    res = await db.execute(stmt)
    synced_payments = res.scalar_one() or 0

    return {
        "google_sheet_id": settings.GOOGLE_SHEET_ID,
        "service_account_email": settings.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        "is_configured": bool(settings.GOOGLE_SHEET_ID),
        "synced_payments_count": synced_payments,
        "sync_url": f"https://docs.google.com/spreadsheets/d/{settings.GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Orders" if settings.GOOGLE_SHEET_ID else None,
        "recommended_permission": "Anyone with the link can view (Viewer)",
        "server_time": datetime.datetime.utcnow().isoformat()
    }


@router.post("/sheets/sync")
async def trigger_google_sheet_sync(
    req: Optional[SheetSyncRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches the latest orders from GharSansar Google Sheet and syncs them into SQLite.
    """
    sheet_id = req.sheet_id if req and req.sheet_id else settings.GOOGLE_SHEET_ID
    sheet_url = req.sheet_url if req and req.sheet_url else settings.GOOGLE_SHEET_CSV_URL

    service = GoogleSheetsSyncService(db)
    result = await service.sync_from_spreadsheet(sheet_id=sheet_id, custom_url=sheet_url)

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message", "Sync failed"))

    return result


@router.post("/sheets/webhook")
async def receive_sheet_or_ecommerce_webhook(
    payload: SheetWebhookPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Receives an order event directly from Google Apps Script or GharSansar backend.
    """
    service = GoogleSheetsSyncService(db)
    row_dict = payload.model_dump()
    result = await service.ingest_order_row(row_dict)

    # If this was a failed payment, trigger detection pipeline
    if result.get("status") == "FAILED":
        try:
            from backend.app.services.incident_service import IncidentService
            inc_svc = IncidentService(db)
            await inc_svc.run_detection_pipeline(lookback_hours=24, min_sample_size=1)
        except Exception:
            pass

    return {
        "status": "success",
        "message": f"Order {payload.order_id or payload.razorpay_order_id} ingested successfully",
        "details": result
    }


@router.post("/sheets/import-csv")
async def import_raw_csv(
    req: CsvImportRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Allows pasting raw CSV text directly from Google Sheet for instant sync without network dependency.
    """
    service = GoogleSheetsSyncService(db)
    rows = service.parse_csv_rows(req.csv_content)
    if not rows:
        raise HTTPException(status_code=400, detail="Could not parse any rows from provided CSV content.")

    summary = await service.sync_rows(rows)
    return summary
