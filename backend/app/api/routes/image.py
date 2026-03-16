"""
Image Input Route — skin/eye/tongue analysis
Uses Groq LLaMA vision to analyse uploaded medical images
"""
from fastapi import APIRouter, UploadFile, File, Form
from groq import Groq
from app.config import settings
import base64

router = APIRouter()
client = Groq(api_key=settings.GROQ_API_KEY)

@router.post("/analyse")
async def analyse_image(
    image: UploadFile = File(...),
    body_part: str = Form(default="skin"),
    language: str = Form(default="en")
):
    """Analyse a medical image and return possible conditions."""
    image_bytes = await image.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    media_type = image.content_type or "image/jpeg"

    LANG_NAMES = {"en": "English", "ta": "Tamil", "ml": "Malayalam", "hi": "Hindi"}
    lang_name = LANG_NAMES.get(language, "English")

    prompt = f"""You are a medical assistant analysing a {body_part} image.

Describe what you see in simple, plain {lang_name} that a normal person can understand.
List any visible symptoms or skin conditions you can identify.
Rate severity as mild/moderate/severe.
Say if the person should see a doctor.

Respond in JSON:
{{
  "visible_symptoms": ["symptom1", "symptom2"],
  "possible_condition": "condition name in {lang_name}",
  "description": "simple explanation in {lang_name}",
  "severity": "mild",
  "see_doctor": false,
  "confidence": 0.7
}}"""

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_b64}"}},
                {"type": "text", "text": prompt}
            ]
        }],
        max_tokens=600,
        temperature=0.3
    )

    import json, re
    content = response.choices[0].message.content
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        result = json.loads(match.group())
    else:
        result = {"visible_symptoms": [], "description": content, "confidence": 0.5}

    result["body_part"] = body_part
    result["language"] = language
    return result