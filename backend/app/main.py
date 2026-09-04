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


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="PayFixor Agent API",
    description="Detect. Diagnose. Recover. Prove. — AI-powered payment revenue recovery agent.",
    version="1.0.0",
    lifespan=lifespan
)

allowed_origins = ["*"] if settings.DEBUG else settings.ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(recovery_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(webhooks_router, prefix=settings.API_V1_STR)

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


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
