from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class SymptomEntry(BaseModel):
    symptom: str
    severity: int  # 1-10
    duration_days: int
    date_reported: Optional[date] = None

class SymptomRequest(BaseModel):
    symptoms: List[SymptomEntry]
    language: str = "en"       # en, ta, ml, hi
    age: Optional[int] = None
    gender: Optional[str] = None
    input_type: str = "text"   # text, voice, image
    session_id: Optional[str] = None

class ImageSymptomRequest(BaseModel):
    image_base64: str
    body_part: str             # skin, eye, tongue
    language: str = "en"
