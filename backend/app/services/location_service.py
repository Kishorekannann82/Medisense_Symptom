"""
Location-Based Disease Risk Service
Detects current disease outbreaks in user's area and 
cross-references with reported symptoms.
"""
from groq import Groq
from app.config import settings
import json, re
from typing import List, Dict

client = Groq(api_key=settings.GROQ_API_KEY)

# Known seasonal/regional disease patterns for India
REGIONAL_RISK = {
    # Tamil Nadu
    "chennai":    {"monsoon": ["dengue","leptospirosis","cholera"], "summer": ["heat_stroke","typhoid"], "winter": ["influenza","common_cold"]},
    "tamil nadu": {"monsoon": ["dengue","malaria"], "summer": ["typhoid","heat_stroke"], "winter": ["influenza"]},
    "coimbatore": {"monsoon": ["dengue","malaria"], "summer": ["typhoid"], "winter": ["common_cold"]},
    # Kerala
    "kerala":     {"monsoon": ["leptospirosis","dengue","malaria"], "summer": ["typhoid","chickenpox"], "winter": ["influenza"]},
    "kochi":      {"monsoon": ["leptospirosis","dengue"], "summer": ["typhoid"], "winter": ["influenza"]},
    # Karnataka
    "bangalore":  {"monsoon": ["dengue","typhoid"], "summer": ["heat_stroke","chickenpox"], "winter": ["influenza","cold"]},
    # Maharashtra
    "mumbai":     {"monsoon": ["leptospirosis","malaria","dengue"], "summer": ["typhoid","heat_stroke"], "winter": ["influenza"]},
    # Default India
    "default":    {"monsoon": ["dengue","malaria","typhoid"], "summer": ["heat_stroke","typhoid"], "winter": ["influenza","common_cold"]},
}

# Month → season mapping for India
def get_season(month: int) -> str:
    if month in [6, 7, 8, 9, 10]:   return "monsoon"
    elif month in [3, 4, 5]:         return "summer"
    else:                             return "winter"


def get_regional_risks(location: str, month: int) -> Dict:
    """Get disease risks for a location and current month."""
    location_lower = location.lower().strip()
    season = get_season(month)

    # Find matching region
    region_data = REGIONAL_RISK.get("default")
    for key in REGIONAL_RISK:
        if key in location_lower or location_lower in key:
            region_data = REGIONAL_RISK[key]
            break

    high_risk_diseases = region_data.get(season, [])

    return {
        "location":           location,
        "season":             season,
        "high_risk_diseases": high_risk_diseases,
        "risk_level":         "high" if len(high_risk_diseases) >= 3 else "moderate"
    }


def analyse_location_symptom_match(
    symptoms: List[str],
    location: str,
    month: int
) -> Dict:
    """
    Cross-reference user symptoms with regional disease risks.
    Returns geo-aware diagnosis boost.
    """
    regional = get_regional_risks(location, month)
    high_risk = regional["high_risk_diseases"]

    # Ask Groq to analyse the match
    prompt = f"""You are a public health expert for India.

Location: {location}
Season: {regional['season']}
Currently high-risk diseases in this area: {', '.join(high_risk)}
Patient symptoms: {', '.join(symptoms)}

Analyse if the patient's symptoms match any high-risk diseases currently prevalent in their area.

Respond in JSON:
{{
  "location_match": true/false,
  "matched_disease": "disease name or null",
  "risk_message": "1 sentence warning in plain English",
  "recommendation": "specific action for this location",
  "confidence_boost": 0.1 to 0.3
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2, max_tokens=300
        )
        content = response.choices[0].message.content
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            result = json.loads(match.group())
            result["regional_data"] = regional
            return result
    except Exception as e:
        print(f"Location service error: {e}")

    return {
        "location_match":    False,
        "matched_disease":   None,
        "risk_message":      f"Stay aware of {', '.join(high_risk[:2])} risk in your area.",
        "recommendation":    "Keep surroundings clean, avoid stagnant water.",
        "confidence_boost":  0.0,
        "regional_data":     regional
    }