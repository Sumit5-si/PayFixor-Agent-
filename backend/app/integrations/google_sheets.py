import csv
import io
import re
import datetime
import logging
from typing import Dict, Any, List, Optional, Tuple
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database.models import Payment, Customer, PaymentStatus, PaymentMethod, ComplaintStatus
from backend.app.utils.config import settings

logger = logging.getLogger(__name__)


def _clean_str(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def _parse_amount(val: Any) -> float:
    if not val:
        return 0.0
    cleaned = re.sub(r"[^\d.]", "", str(val))
    try:
        return float(cleaned)
    except Exception:
        return 0.0


def _parse_timestamp(val: Any) -> datetime.datetime:
    if not val:
        return datetime.datetime.utcnow()
    val_str = str(val).strip()
    # Try ISO formats and common date strings
    formats = [
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%d-%m-%Y %H:%M:%S",
        "%m/%d/%Y %I:%M:%S %p",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(val_str, fmt)
        except Exception:
            pass
    return datetime.datetime.utcnow()


class GoogleSheetsSyncService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def get_sheet_urls(self, sheet_id: Optional[str] = None) -> List[str]:
        sid = sheet_id or settings.GOOGLE_SHEET_ID
        if not sid:
            return []
        # Support both Google visualization CSV query and standard export
        return [
            f"https://docs.google.com/spreadsheets/d/{sid}/gviz/tq?tqx=out:csv&sheet=Orders",
            f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&sheet=Orders",
            f"https://docs.google.com/spreadsheets/d/{sid}/gviz/tq?tqx=out:csv",
            f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv"
        ]

    async def fetch_csv_from_google_sheet(self, sheet_id: Optional[str] = None, custom_url: Optional[str] = None) -> Tuple[bool, str, str]:
        urls = [custom_url] if custom_url else self.get_sheet_urls(sheet_id)
        if not urls:
            return False, "", "No Google Sheet ID or URL configured."

        async with httpx.AsyncClient(follow_redirects=True, timeout=12.0) as client:
            last_err = ""
            for url in urls:
                if not url:
                    continue
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200 and resp.text:
                        # Check if response is an HTML login/error page rather than CSV
                        if "<!DOCTYPE html>" in resp.text or "<html" in resp.text:
                            last_err = "Google Sheet is private. Set sharing to 'Anyone with the link can view' (Viewer)."
                            continue
                        return True, resp.text, ""
                    elif resp.status_code == 401 or resp.status_code == 403:
                        last_err = "Sheet is private. Change General Access in Google Sheet Share settings to 'Anyone with the link' (Viewer)."
                    else:
                        last_err = f"HTTP {resp.status_code} fetching Google Sheet"
                except Exception as ex:
                    last_err = str(ex)
                    logger.warning(f"Failed to fetch {url}: {ex}")

        return False, "", last_err or "Failed to connect to Google Sheet"

    def parse_csv_rows(self, csv_content: str) -> List[Dict[str, Any]]:
        reader = csv.reader(io.StringIO(csv_content.strip()))
        rows = list(reader)
        if not rows:
            return []

        # Find header row
        headers = [c.strip().lower().replace(" ", "_").replace("-", "_") for c in rows[0]]
        dict_rows = []
        for raw_row in rows[1:]:
            if not any(raw_row):
                continue
            item = {}
            for i, val in enumerate(raw_row):
                if i < len(headers):
                    item[headers[i]] = val.strip()
            dict_rows.append(item)
        return dict_rows

    async def ingest_order_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps a GharSansar order row into Customer and Payment models.
        Expected columns:
        order_id | razorpay_order_id | razorpay_payment_id | customer_name | phone |
        address | pincode | product_id | quantity | amount | status | timestamp
        """
        order_id = _clean_str(row.get("order_id") or row.get("razorpay_order_id") or "")
        payment_id = _clean_str(row.get("razorpay_payment_id") or "")
        if not payment_id:
            # Generate stable fallback payment_id if payment failed before gateway generated an id
            payment_id = f"pay_gs_{order_id}" if order_id else f"pay_gs_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        if not order_id:
            order_id = f"order_{payment_id}"

        customer_name = _clean_str(row.get("customer_name") or row.get("name") or "GharSansar Customer")
        phone = _clean_str(row.get("phone") or row.get("contact") or "")
        email = _clean_str(row.get("email") or f"{phone or 'customer'}@gharsansar.com")
        amount = _parse_amount(row.get("amount") or row.get("price") or 0.0)
        status_raw = _clean_str(row.get("status") or "").upper()
        timestamp = _parse_timestamp(row.get("timestamp") or row.get("date"))

        # Determine Payment Status and Error Info
        target_status = PaymentStatus.SUCCESS
        error_code = None
        error_description = None

        if "FAIL" in status_raw or "DECLINE" in status_raw or "CANCEL" in status_raw:
            target_status = PaymentStatus.FAILED
            # Parse error description after "FAILED:"
            parts = status_raw.split(":", 1)
            if len(parts) > 1:
                error_description = parts[1].strip()
            else:
                error_description = status_raw

            if "CANCEL" in error_description.upper():
                error_code = "PAYMENT_CANCELLED_BY_USER"
            elif "TIMEOUT" in error_description.upper():
                error_code = "GATEWAY_TIMEOUT"
            elif "DECLIN" in error_description.upper():
                error_code = "BANK_DECLINED"
            else:
                error_code = "BAD_REQUEST_ERROR"
        elif "PENDING" in status_raw or "INIT" in status_raw:
            target_status = PaymentStatus.PENDING

        # Heuristic for payment method and bank
        payment_method = PaymentMethod.UPI
        bank = "Bank_X"
        method_raw = _clean_str(row.get("method") or row.get("payment_method") or "").upper()
        if "CARD" in method_raw:
            payment_method = PaymentMethod.CARD
            bank = "HDFC_BANK"
        elif "NETBANK" in method_raw:
            payment_method = PaymentMethod.NETBANKING
            bank = "ICICI_BANK"

        # Customer ID
        customer_id = f"cust_{phone[-10:]}" if phone and len(phone) >= 10 else f"cust_{order_id[-8:]}"

        # 1. Ensure Customer exists
        stmt_cust = select(Customer).where(Customer.customer_id == customer_id)
        res_cust = await self.db.execute(stmt_cust)
        customer = res_cust.scalar_one_or_none()

        if not customer:
            customer = Customer(
                customer_id=customer_id,
                name=customer_name,
                email=email,
                phone=phone or None,
                total_spend=amount if target_status == PaymentStatus.SUCCESS else 0.0,
                failed_attempts_count=1 if target_status == PaymentStatus.FAILED else 0,
                complaint_status=ComplaintStatus.NORMAL
            )
            self.db.add(customer)
            await self.db.flush()
        else:
            if target_status == PaymentStatus.FAILED:
                customer.failed_attempts_count += 1
            elif target_status == PaymentStatus.SUCCESS:
                customer.total_spend += amount

        # 2. Check if Payment exists
        stmt_pay = select(Payment).where(
            (Payment.payment_id == payment_id) | (Payment.order_id == order_id)
        )
        res_pay = await self.db.execute(stmt_pay)
        payment = res_pay.scalar_one_or_none()

        action = "updated"
        if not payment:
            payment = Payment(
                payment_id=payment_id,
                customer_id=customer_id,
                order_id=order_id,
                amount=amount,
                currency="INR",
                payment_method=payment_method,
                bank=bank,
                psp="Razorpay",
                status=target_status,
                error_code=error_code,
                error_description=error_description,
                attempt_number=1,
                timestamp=timestamp,
                metadata_json={
                    "source": "google_spreadsheet",
                    "product_id": _clean_str(row.get("product_id")),
                    "quantity": _clean_str(row.get("quantity")),
                    "address": _clean_str(row.get("address")),
                    "pincode": _clean_str(row.get("pincode")),
                    "raw_status": status_raw
                }
            )
            self.db.add(payment)
            action = "created"
        else:
            payment.status = target_status
            if target_status == PaymentStatus.FAILED:
                payment.error_code = error_code or payment.error_code
                payment.error_description = error_description or payment.error_description
            if amount > 0:
                payment.amount = amount

        await self.db.commit()
        return {
            "payment_id": payment_id,
            "order_id": order_id,
            "status": target_status.value,
            "action": action
        }

    async def sync_rows(self, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        results = []
        created_count = 0
        updated_count = 0
        failed_orders = 0
        success_orders = 0

        for r in rows:
            try:
                res = await self.ingest_order_row(r)
                results.append(res)
                if res["action"] == "created":
                    created_count += 1
                else:
                    updated_count += 1

                if res["status"] == "FAILED":
                    failed_orders += 1
                elif res["status"] == "SUCCESS":
                    success_orders += 1
            except Exception as e:
                logger.error(f"Error ingesting sheet row {r}: {e}")

        # If failed orders are detected, trigger detection pipeline so Incident is immediately active
        incident_info = None
        if failed_orders > 0:
            try:
                from backend.app.services.incident_service import IncidentService
                inc_svc = IncidentService(self.db)
                detected = await inc_svc.run_detection_pipeline(lookback_hours=48, min_sample_size=1)
                incident_info = f"Detection triggered: {len(detected)} active incidents updated"
            except Exception as ex:
                logger.warning(f"Could not auto-trigger detection: {ex}")

        return {
            "status": "success",
            "total_rows": len(rows),
            "payments_created": created_count,
            "payments_updated": updated_count,
            "failed_orders": failed_orders,
            "success_orders": success_orders,
            "incident_info": incident_info,
            "details": results
        }

    async def sync_from_spreadsheet(self, sheet_id: Optional[str] = None, custom_url: Optional[str] = None) -> Dict[str, Any]:
        ok, csv_text, err = await self.fetch_csv_from_google_sheet(sheet_id=sheet_id, custom_url=custom_url)
        if not ok:
            return {
                "status": "error",
                "message": err,
                "sheet_id": sheet_id or settings.GOOGLE_SHEET_ID
            }

        rows = self.parse_csv_rows(csv_text)
        if not rows:
            return {
                "status": "empty",
                "message": "Google Sheet connected successfully, but no order rows found in 'Orders' tab.",
                "total_rows": 0
            }

        summary = await self.sync_rows(rows)
        summary["sheet_id"] = sheet_id or settings.GOOGLE_SHEET_ID
        return summary
