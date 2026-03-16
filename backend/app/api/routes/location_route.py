"""
Location Risk API Route
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.services.location_service import analyse_location_symptom_match, get_regional_risks

router = APIRouter()

class LocationRiskRequest(BaseModel):
    location: str
    symptoms: List[str] = []
    month:    int = datetime.now().month

@router.post("/risk")
async def get_location_risk(req: LocationRiskRequest):
    if req.symptoms:
        result = analyse_location_symptom_match(req.symptoms, req.location, req.month)
    else:
        result = get_regional_risks(req.location, req.month)
    return result

@router.get("/seasons")
async def get_season_info():
    month = datetime.now().month
    if month in [6,7,8,9,10]: season = "Monsoon"
    elif month in [3,4,5]:     season = "Summer"
    else:                       season = "Winter"
    return {"current_month": month, "season": season}