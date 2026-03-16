from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.services.ai.groq_service import get_diagnosis
from app.services.ai.temporal_model import analyse_progression, get_followup_questions
from app.services.ai.diagnosis_engine import hybrid_predict, compute_shap_weights
from app.services.medicine.remedy_service import get_remedies
from app.services.firebase_service import save_session
from app.services.urgency_service import calculate_urgency

router = APIRouter()

class SymptomEntry(BaseModel):
    symptom:       str
    severity:      int = 5
    duration_days: int = 1
    date_reported: Optional[str] = None

class DiagnosisRequest(BaseModel):
    symptoms: List[SymptomEntry]
    language: str            = "en"
    age:      Optional[int]  = None
    gender:   Optional[str]  = None

@router.post("/analyse")
async def analyse_symptoms(req: DiagnosisRequest):
    symptoms_list  = [s.dict() for s in req.symptoms]
    symptom_names  = [s.symptom for s in req.symptoms]
    language       = req.language

    # 1. Temporal analysis
    temporal = analyse_progression(symptoms_list)

    # 2. ML hybrid prediction
    max_days    = max((s.duration_days for s in req.symptoms), default=1)
    day_history = []
    for day in range(1, max_days + 1):
        day_syms = [s.symptom for s in req.symptoms if s.duration_days >= day]
        if day_syms:
            day_history.append(day_syms)

    ml_predictions = hybrid_predict(symptom_names, day_history if max_days > 1 else None, top_n=3)

    # 3. SHAP XAI
    shap_weights = compute_shap_weights(symptom_names)

    # 4. Urgency Score
    urgency = calculate_urgency(symptoms_list, ml_predictions, temporal)

    # 5. Groq plain language explanation
    top_disease  = ml_predictions[0]["disease"] if ml_predictions else None
    groq_result  = get_diagnosis(symptoms_list, language=language, age=req.age, gender=req.gender, ml_hint=top_disease)

    # 6. Merge results
    top_conditions = groq_result.get("top_conditions", [])
    for i, condition in enumerate(top_conditions):
        if i < len(ml_predictions):
            condition["confidence"]  = ml_predictions[i]["confidence"]
            condition["ml_disease"]  = ml_predictions[i]["disease"]
        condition["shap_explanation"] = shap_weights
        disease_key = condition.get("ml_disease", condition.get("condition", "")).lower()
        condition["medicines"] = get_remedies(disease_key, language)

    # 7. Follow-up questions
    followup = get_followup_questions(symptom_names, language)

    result = {
        "session_id":       f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "generated_at":     datetime.now().isoformat(),
        "symptoms":         symptoms_list,
        "temporal_analysis": temporal,
        "ml_predictions":   ml_predictions,
        "urgency":          urgency,
        "diagnosis": {
            "top_conditions":   top_conditions,
            "timeline_summary": groq_result.get("timeline_summary", ""),
            "model_used":       "RF+LSTM+LLaMA Hybrid"
        },
        "followup_questions": followup,
        "language":  language,
        "patient":   {"age": req.age, "gender": req.gender}
    }

    try:
        save_session(result["session_id"], result)
    except Exception as e:
        print(f"Firebase save skipped: {e}")

    return result