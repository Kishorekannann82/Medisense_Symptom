from fastapi import APIRouter
from app.services.medicine.remedy_service import get_remedies

router = APIRouter()

@router.get("/{condition}")
async def get_medicine(condition: str, language: str = "en"):
    return get_remedies(condition, language)
