"""
AI Medicine Interaction Checker
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from app.config import settings
import json, re

router = APIRouter()
client = Groq(api_key=settings.GROQ_API_KEY)

LANG_NAMES = {"en":"English","ta":"Tamil","ml":"Malayalam","hi":"Hindi"}

KNOWN_INTERACTIONS = {
    ("warfarin","aspirin"):       {"severity":"high",     "effect":"Increased bleeding risk"},
    ("metformin","alcohol"):      {"severity":"high",     "effect":"Dangerous lactic acidosis"},
    ("paracetamol","alcohol"):    {"severity":"high",     "effect":"Severe liver damage"},
    ("crocin","alcohol"):         {"severity":"high",     "effect":"Severe liver damage"},
    ("dolo","alcohol"):           {"severity":"high",     "effect":"Severe liver damage"},
    ("ibuprofen","aspirin"):      {"severity":"moderate", "effect":"Increased stomach bleeding"},
    ("brufen","aspirin"):         {"severity":"moderate", "effect":"Increased stomach bleeding"},
    ("cetirizine","alcohol"):     {"severity":"moderate", "effect":"Excessive drowsiness"},
    ("omeprazole","clopidogrel"): {"severity":"high",     "effect":"Reduced heart medication effect"},
}

class InteractionRequest(BaseModel):
    medicines:  List[str]
    language:   Optional[str] = "en"
    age:        Optional[int] = None
    conditions: Optional[str] = ""


def check_local(medicines: List[str]):
    alerts = []
    lower  = [m.lower() for m in medicines]
    seen   = set()
    for a in lower:
        for b in lower:
            if a == b: continue
            key1 = (a, b)
            key2 = (b, a)
            pair_id = tuple(sorted([a, b]))
            if pair_id in seen: continue
            for (k1, k2), info in KNOWN_INTERACTIONS.items():
                if (k1 in a or a in k1) and (k2 in b or b in k2):
                    seen.add(pair_id)
                    alerts.append({
                        "medicines": [a, b],
                        "severity":  info["severity"],
                        "effect":    info["effect"],
                        "advice":    "Consult a doctor before taking these together"
                    })
                    break
    return alerts


@router.post("/check")
async def check_interactions(req: InteractionRequest):
    medicines = req.medicines
    lang_name = LANG_NAMES.get(req.language or "en", "English")

    local_alerts = check_local(medicines)

    conditions_text = f"Patient has: {req.conditions}" if req.conditions else ""
    age_text        = f"Patient age: {req.age}" if req.age else ""

    prompt = f"""You are a helpful pharmacist in India explaining medicine safety to a common person.
{age_text}
{conditions_text}
Medicines the person is taking: {', '.join(medicines)}

Important: The person may have used common names like "Crocin", "Dolo", "Brufen", "Combiflam" etc.
Treat all common Indian brand names correctly.

Check:
1. Dangerous combinations
2. Side effects to watch for  
3. Best time to take each (morning/night/after food)
4. Foods/drinks to avoid

Respond ONLY in valid JSON (no extra text):
{{
  "interactions": [{{"medicines":["a","b"],"severity":"high","effect":"...","advice":"..."}}],
  "side_effects": ["..."],
  "timing_advice": [{{"medicine":"name","when":"after food/before food/at night"}}],
  "food_warnings": ["..."],
  "safe_to_take": true,
  "summary": "2 sentence plain summary in {lang_name}"
}}"""

    try:
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}],
            temperature=0.2, max_tokens=800
        )
        content = resp.choices[0].message.content
        match   = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            ai = json.loads(match.group())
            # Merge local + AI, no duplicates
            all_i = local_alerts[:]
            for item in ai.get("interactions", []):
                pair = tuple(sorted([m.lower() for m in item.get("medicines",[])]))
                exists = any(tuple(sorted([m.lower() for m in a["medicines"]])) == pair for a in all_i)
                if not exists:
                    all_i.append(item)
            has_high = any(i.get("severity") == "high" for i in all_i)
            return {
                "medicines":     medicines,
                "interactions":  all_i,
                "side_effects":  ai.get("side_effects", []),
                "timing_advice": ai.get("timing_advice", []),
                "food_warnings": ai.get("food_warnings", []),
                "safe_to_take":  not has_high,
                "summary":       ai.get("summary", ""),
                "alert_level":   "high" if has_high else "moderate" if all_i else "safe"
            }
    except Exception as e:
        print(f"AI error: {e}")

    has_high = any(a["severity"] == "high" for a in local_alerts)
    return {
        "medicines":     medicines,
        "interactions":  local_alerts,
        "side_effects":  [],
        "timing_advice": [],
        "food_warnings": [],
        "safe_to_take":  not has_high,
        "summary":       "Basic check done. Consult pharmacist for full analysis.",
        "alert_level":   "high" if has_high else "safe"
    }


@router.get("/common")
async def get_common_medicines():
    return {"medicines": [
        "Crocin", "Dolo 650", "Paracetamol", "Combiflam", "Brufen",
        "Aspirin", "Cetcip", "Cetirizine", "Omeprazole", "Pan 40",
        "Metformin", "Glucophage", "Amlodipine", "Azithromycin",
        "Amoxicillin", "Augmentin", "Ciprofloxacin", "Ranitidine",
        "Montelukast", "Salbutamol inhaler", "Vitamin D3", "Iron tablets",
        "Calcium tablets", "Gelusil", "Digene", "Electral ORS",
        "Atenolol", "Losartan", "Insulin", "Alcohol"
    ]}