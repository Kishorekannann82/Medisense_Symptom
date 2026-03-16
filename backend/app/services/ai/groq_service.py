from groq import Groq
from app.config import settings
from typing import List, Optional

client = Groq(api_key=settings.GROQ_API_KEY)

LANGUAGE_NAMES = {
    "en": "English", "ta": "Tamil (தமிழ்)",
    "ml": "Malayalam (മലയാളം)", "hi": "Hindi (हिंदी)"
}

def get_diagnosis(symptoms: list, language: str = "en",
                  age: int = None, gender: str = None,
                  ml_hint: str = None) -> dict:
    lang_name = LANGUAGE_NAMES.get(language, "English")
    age_info    = f"Patient age: {age}" if age else ""
    gender_info = f"Patient gender: {gender}" if gender else ""
    ml_info     = f"\nML model suggests: {ml_hint} as most likely diagnosis." if ml_hint else ""
    symptom_text = "\n".join([
        f"- {s['symptom']} (severity: {s['severity']}/10, duration: {s['duration_days']} days)"
        for s in symptoms
    ])

    prompt = f"""You are a warm medical assistant helping a non-medical person.
{age_info} {gender_info} {ml_info}

Symptoms:
{symptom_text}

Give top 3 possible conditions. Explain in very simple {lang_name} — like talking to a village elder.
For each: name, simple explanation (no jargon), severity (mild/moderate/severe), see_doctor (true/false).
Confidence scores must add up to ~1.0.

Respond ONLY in this JSON:
{{
  "top_conditions": [
    {{
      "condition": "name in {lang_name}",
      "confidence": 0.75,
      "description": "simple explanation in {lang_name}",
      "key_symptoms": ["symptom1", "symptom2"],
      "severity_level": "mild",
      "see_doctor": false
    }}
  ],
  "timeline_summary": "brief summary in {lang_name}"
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3, max_tokens=2000
    )

    import json, re
    content = response.choices[0].message.content
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
            pass
    return {"top_conditions": [], "timeline_summary": "", "raw": content}


def extract_symptoms_from_text(text: str, language: str = "en") -> list:
    prompt = f"""Extract medical symptoms from: "{text}"
Return ONLY a JSON array:
[{{"symptom": "fever", "severity": 6, "duration_days": 2}}]
Rules: severity default 5, duration default 1, English only, real symptoms only."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2, max_tokens=400
    )
    import json, re
    content = response.choices[0].message.content
    match = re.search(r'\[.*\]', content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
            pass
    return []