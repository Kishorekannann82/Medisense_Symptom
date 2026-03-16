"""
Symptom Journey Tracker API Routes
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.journey_service import (
    create_journey, get_journey, add_day_entry,
    analyse_journey_trend, list_journeys
)
from app.services.ai.groq_service import get_diagnosis
from app.services.ai.diagnosis_engine import hybrid_predict, compute_shap_weights
from app.services.medicine.remedy_service import get_remedies

router = APIRouter()

class PatientInfo(BaseModel):
    age:      Optional[int]  = None
    gender:   Optional[str]  = None
    language: str            = "en"

class SymptomEntry(BaseModel):
    symptom:      str
    severity:     int = 5
    duration_days: int = 1

class DayEntryRequest(BaseModel):
    symptoms: List[SymptomEntry]
    notes:    Optional[str] = ""
    language: str           = "en"


@router.post("/start")
async def start_journey(patient: PatientInfo):
    """Start a new symptom journey."""
    journey = create_journey(patient.dict())
    return {"journey_id": journey["journey_id"], "message": "Journey started"}


@router.post("/{journey_id}/day")
async def add_day(journey_id: str, req: DayEntryRequest):
    """Add today's symptoms to an existing journey."""
    symptoms_list = [s.dict() for s in req.symptoms]
    journey = add_day_entry(journey_id, symptoms_list, req.notes)

    # Analyse trend after adding
    trend = analyse_journey_trend(journey)

    # Get ML diagnosis based on ALL symptoms across days
    all_syms = []
    seen = set()
    for day in journey["days"]:
        for s in day["symptoms"]:
            if s["symptom"] not in seen:
                all_syms.append(s)
                seen.add(s["symptom"])

    symptom_names = [s["symptom"] for s in all_syms]
    day_history   = [[s["symptom"] for s in d["symptoms"]] for d in journey["days"]]

    ml_preds   = hybrid_predict(symptom_names, day_history, top_n=3)
    shap_weights = compute_shap_weights(symptom_names)

    # Groq explanation
    groq_result = get_diagnosis(
        all_syms, req.language,
        ml_hint=ml_preds[0]["disease"] if ml_preds else None
    )

    top_conditions = groq_result.get("top_conditions", [])
    for i, c in enumerate(top_conditions):
        if i < len(ml_preds):
            c["confidence"]       = ml_preds[i]["confidence"]
        c["shap_explanation"] = shap_weights
        c["medicines"]        = get_remedies(c.get("condition", ""), req.language)

    return {
        "journey_id":    journey_id,
        "day_number":    len(journey["days"]),
        "trend_analysis": trend,
        "diagnosis":     {"top_conditions": top_conditions},
        "urgency_score": trend["urgency_score"],
        "urgency_label": trend["urgency_label"],
        "urgency_color": trend["urgency_color"],
        "urgency_action": trend["urgency_action"],
        "escalation_alert": trend["danger_alert"],
        "new_symptoms_today": trend["new_symptoms"],
        "days_tracked":  trend["days_tracked"],
        "severity_trend": trend["severity_trend"]
    }


@router.get("/{journey_id}")
async def get_journey_details(journey_id: str):
    """Get full journey with trend analysis."""
    journey = get_journey(journey_id)
    if not journey:
        return {"error": "Journey not found"}
    trend = analyse_journey_trend(journey)
    return {**journey, "trend_analysis": trend}


@router.get("/")
async def list_all_journeys():
    return {"journeys": list_journeys()}