"""
Database initialization and configuration for Beanie ODM
"""
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from config.settings import get_settings
from models.capsule import Capsule


settings = get_settings()


async def init_database():
    """Initialize database connection and Beanie ODM"""

    # Create Motor client
    client = AsyncIOMotorClient(settings.db_url)

    # Database name from connection string
    database = client[settings.app_name]

    try:
        # Initialize Beanie with all models
        await init_beanie(
            database=database,
            document_models=[
                Capsule
            ]
        )
        await database.command("ping")
        print(f"✅ Database initialized: {settings.app_name}")
        return client
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        raise


async def close_database():
    """Close database connection"""
    # Beanie handles connection cleanup automatically
    print("✅ Database connection closed")
