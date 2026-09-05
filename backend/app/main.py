import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from backend.app.utils.config import settings
from backend.app.database.session import init_db
from backend.app.api.payments import router as payments_router
from backend.app.api.incidents import router as incidents_router
from backend.app.api.recovery import router as recovery_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.webhooks import router as webhooks_router
import asyncio
import logging
from backend.app.api.integrations import router as integrations_router

logger = logging.getLogger(__name__)


async def auto_sync_sheets_loop():
    """Continuously checks Google Sheets in the background every 20 seconds"""
    await asyncio.sleep(6)  # Initial grace period after startup
    while True:
        try:
            from backend.app.database.session import async_session_maker
            from backend.app.integrations.google_sheets import GoogleSheetsSyncService
            async with async_session_maker() as db:
                service = GoogleSheetsSyncService(db)
                await service.sync_from_spreadsheet()
        except asyncio.CancelledError:
            break
        except Exception as ex:
            logger.debug(f"Background Google Sheets sync check: {ex}")
        await asyncio.sleep(20)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    sync_task = asyncio.create_task(auto_sync_sheets_loop())
    try:
        yield
    finally:
        sync_task.cancel()
        try:
            await sync_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="PayFixor Agent API",
    description="Detect. Diagnose. Recover. Prove. — AI-powered payment revenue recovery agent.",
    version="1.0.0",
    lifespan=lifespan
)

# Permissive CORS to allow frontend from localhost, 127.0.0.1, Live Server, or file://
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(recovery_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(webhooks_router, prefix=settings.API_V1_STR)
app.include_router(integrations_router, prefix=settings.API_V1_STR)

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")
    css_dir = os.path.join(frontend_dir, "css")
    js_dir = os.path.join(frontend_dir, "js")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")


@app.get("/dashboard")
@app.get("/app")
async def serve_dashboard():
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Dashboard frontend files not found"}


@app.get("/")
async def root():
    return {
        "product": "PayFixor Agent",
        "tagline": "Detect. Diagnose. Recover. Prove.",
        "status": "operational",
        "version": "1.0.0",
        "dashboard_url": "/dashboard",
        "docs_url": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
