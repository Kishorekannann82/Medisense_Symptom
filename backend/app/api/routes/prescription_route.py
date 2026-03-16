"""
Prescription Image Reader
User uploads photo of doctor's prescription →
AI reads medicine names → returns structured list
"""
from fastapi import APIRouter, UploadFile, File, Form
from groq import Groq
from app.config import settings
import base64, json, re

router = APIRouter()
client = Groq(api_key=settings.GROQ_API_KEY)

@router.post("/read")
async def read_prescription(
    image:    UploadFile = File(...),
    language: str        = Form(default="en")
):
    image_bytes = await image.read()
    image_b64   = base64.b64encode(image_bytes).decode("utf-8")
    media_type  = image.content_type or "image/jpeg"

    prompt = """You are a medical assistant reading a doctor's prescription photo.

Extract ALL medicines written in this prescription. Include:
- Medicine name (as written)
- Dosage if visible (e.g. 500mg, 10mg)
- Frequency if written (e.g. twice daily, after food)
- Duration if written (e.g. 5 days, 1 week)

Also extract:
- Doctor name if visible
- Patient name if visible
- Diagnosis/condition if written

Respond ONLY in valid JSON:
{
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "twice daily after food",
      "duration": "5 days"
    }
  ],
  "doctor_name": "Dr. name or null",
  "patient_name": "name or null",
  "diagnosis": "condition or null",
  "notes": "any special instructions or null",
  "readable": true
}

If prescription is not readable or image is unclear, set readable to false."""

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type":      "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{image_b64}"}
                    },
                    {"type": "text", "text": prompt}
                ]
            }],
            max_tokens=800,
            temperature=0.1
        )

        content = response.choices[0].message.content
        match   = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            result = json.loads(match.group())
            return {
                "success":   True,
                "medicines": result.get("medicines", []),
                "doctor":    result.get("doctor_name"),
                "patient":   result.get("patient_name"),
                "diagnosis": result.get("diagnosis"),
                "notes":     result.get("notes"),
                "readable":  result.get("readable", True),
                "raw":       content
            }
    except Exception as e:
        print(f"Prescription read error: {e}")

    return {
        "success":  False,
        "medicines": [],
        "readable":  False,
        "error":    "Could not read prescription. Try a clearer photo."
    }