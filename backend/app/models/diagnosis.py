from pydantic import BaseModel
from typing import List, Optional

class ShapExplanation(BaseModel):
    symptom: str
    weight: float
    impact: str   # "high", "medium", "low"

class DiagnosisResult(BaseModel):
    condition: str
    confidence: float          # 0.0 to 1.0
    description: str           # plain language, in user's language
    shap_explanation: List[ShapExplanation]
    severity_level: str        # "mild", "moderate", "severe"
    see_doctor: bool

class DiagnosisResponse(BaseModel):
    session_id: str
    top_conditions: List[DiagnosisResult]
    language: str
    timeline_summary: Optional[str] = None
    generated_at: str
