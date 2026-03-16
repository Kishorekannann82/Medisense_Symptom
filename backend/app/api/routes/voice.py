"""
Voice Input Route — Native Language Support
Supports Tamil, Malayalam, Hindi, English voice input.
Groq Whisper transcribes in native language,
LLaMA extracts symptoms from native text directly.
"""
from fastapi import APIRouter, UploadFile, File, Form
from groq import Groq
from app.config import settings
from app.services.ai.groq_service import extract_symptoms_from_text
import json, re

router = APIRouter()
client = Groq(api_key=settings.GROQ_API_KEY)

LANG_HINTS = {
    "ta": "Tamil",
    "ml": "Malayalam",
    "hi": "Hindi",
    "en": "English"
}

@router.post("/transcribe")
async def transcribe_voice(
    audio: UploadFile = File(...),
    language: str = Form(default="en")
):
    audio_bytes = await audio.read()

    # ── Step 1: Whisper transcription ─────────────────────
    # Pass language hint so Whisper transcribes in native language
    lang_hint = LANG_HINTS.get(language, "English")

    transcription = client.audio.transcriptions.create(
        model="whisper-large-v3",
        file=(audio.filename or "voice.webm", audio_bytes),
        response_format="text",
        # Whisper auto-detects language — no need to force it
    )

    transcribed_text = str(transcription).strip()

    # ── Step 2: Extract symptoms from native language ─────
    # LLaMA understands Tamil/Malayalam/Hindi directly
    prompt = f"""The following text is spoken in {lang_hint} by a patient describing their symptoms.
Extract all medical symptoms mentioned. Translate symptom names to English.

Text: "{transcribed_text}"

Return ONLY a JSON array. Example:
[{{"symptom": "fever", "severity": 6, "duration_days": 2}}]

Rules:
- severity: estimate from words like "mild/slight"=3, "bad/high"=6, "severe/very bad"=9, default=5
- duration_days: estimate from "today"=1, "2 days"=2, "week"=7, default=1
- Only real medical symptoms
- symptom names must be in English"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=500
    )

    content = response.choices[0].message.content
    detected_symptoms = []
    match = re.search(r'\[.*\]', content, re.DOTALL)
    if match:
        try:
            detected_symptoms = json.loads(match.group())
        except:
            pass

    return {
        "transcribed_text":  transcribed_text,
        "language_detected": language,
        "lang_name":         lang_hint,
        "detected_symptoms": detected_symptoms,
        "symptom_count":     len(detected_symptoms)
    }