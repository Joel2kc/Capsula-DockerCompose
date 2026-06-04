from fastapi import APIRouter
from .capsules import router as capsules_router

router = APIRouter()
router.include_router(capsules_router, prefix="/capsules", tags=["capsules"])
