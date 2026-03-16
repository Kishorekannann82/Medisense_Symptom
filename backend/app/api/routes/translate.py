from fastapi import APIRouter
from pydantic import BaseModel
from app.services.nlp.translator import translate_text, detect_language

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_language: str   # ta, ml, hi, en

class DetectRequest(BaseModel):
    text: str

@router.post("/")
async def translate(request: TranslateRequest):
    translated = translate_text(request.text, request.target_language)
    return {
        "original": request.text,
        "translated": translated,
        "target_language": request.target_language,
        "service": "MyMemory + Groq (free)"
    }

@router.post("/detect")
async def detect(request: DetectRequest):
    lang = detect_language(request.text)
    return {"text": request.text, "detected_language": lang}
