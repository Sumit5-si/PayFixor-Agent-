import json
from fastapi import APIRouter, Depends, Request, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.razorpay.webhooks import WebhookHandler

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/razorpay")
async def receive_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(default=""),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests, validates, and processes incoming Razorpay Webhook events idempotently.
    """
    raw_body_bytes = await request.body()
    raw_body_str = raw_body_bytes.decode("utf-8")

    try:
        payload = json.loads(raw_body_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    handler = WebhookHandler(db)
    success, message, result_data = await handler.process_webhook_event(
        event_payload=payload,
        raw_body=raw_body_str,
        signature=x_razorpay_signature
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "status": "ok",
        "message": message,
        "data": result_data
    }
