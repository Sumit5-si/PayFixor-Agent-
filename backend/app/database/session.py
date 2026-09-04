import uuid
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.utils.config import settings
from backend.app.database.models import Base, Policy

connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


DEFAULT_POLICIES = [
    {
        "name": "MAX_AUTO_RECOVERY_ATTEMPTS",
        "value": str(settings.MAX_AUTO_RECOVERY_ATTEMPTS),
        "value_type": "int",
        "description": "Maximum automated recovery attempts per customer payment failure"
    },
    {
        "name": "MAX_CUSTOMER_RECOVERY_ATTEMPTS",
        "value": str(settings.MAX_CUSTOMER_RECOVERY_ATTEMPTS),
        "value_type": "int",
        "description": "Maximum cumulative recovery attempts before human escalation"
    },
    {
        "name": "MIN_DIAGNOSIS_CONFIDENCE",
        "value": str(settings.MIN_CONFIDENCE_THRESHOLD),
        "value_type": "float",
        "description": "Minimum AI diagnosis confidence required to trigger automated recovery"
    },
    {
        "name": "HIGH_VALUE_THRESHOLD",
        "value": str(settings.HIGH_VALUE_THRESHOLD),
        "value_type": "float",
        "description": "Transactions at or above this value (INR) require human review"
    },
    {
        "name": "STOP_IF_INCIDENT_RESOLVED",
        "value": "true",
        "value_type": "bool",
        "description": "Halt recovery actions if incident status is RESOLVED"
    },
    {
        "name": "DUPLICATE_CAMPAIGN_PROTECTION",
        "value": "true",
        "value_type": "bool",
        "description": "Prevent multiple overlapping recovery campaigns on the same customer order"
    },
    {
        "name": "INSUFFICIENT_EVIDENCE_POLICY",
        "value": "true",
        "value_type": "bool",
        "description": "Prevent automated root-cause actions when incident evidence is inconclusive"
    }
]


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session_maker() as session:
        from sqlalchemy import select
        for p in DEFAULT_POLICIES:
            stmt = select(Policy).where(Policy.name == p["name"])
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                policy = Policy(
                    policy_id=f"POL_{uuid.uuid4().hex[:8].upper()}",
                    name=p["name"],
                    value=p["value"],
                    value_type=p["value_type"],
                    description=p["description"],
                    is_active=True
                )
                session.add(policy)
        await session.commit()
