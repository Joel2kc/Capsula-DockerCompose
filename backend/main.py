from datetime import datetime
from services.logging import init_logger
from config.settings import get_settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from models.database import init_database, close_database
from contextlib import asynccontextmanager

logger = init_logger()
settings = get_settings()


@asynccontextmanager
async def lifespan(app):
    """Lifespan context for FastAPI app to manage database connection."""
    try:
        await init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    try:
        yield
    finally:
        await close_database()
        logger.info("Database closed successfully")

app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[*settings.cors_allow_origins, settings.frontend_url],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router, prefix="/api")


@app.get("/")
def ping():
    return {"ping": "pong"}
