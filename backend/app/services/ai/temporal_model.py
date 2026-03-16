"""
Temporal Symptom Progression Service
Analyses how symptoms change day by day to improve diagnosis accuracy.
"""
from typing import List, Dict

def analyse_progression(symptom_history: List[Dict]) -> Dict:
    if not symptom_history or len(symptom_history) <= 1:
        return {"trend": "insufficient_data", "pattern": "single_entry", "warning": None}

    # Sort safely — handle None dates
    sorted_history = sorted(
        symptom_history,
        key=lambda x: x.get("date_reported") or ""
    )

    severities = [s.get("severity", 5) for s in sorted_history]
    trend = (
        "worsening" if severities[-1] > severities[0]
        else "improving" if severities[-1] < severities[0]
        else "stable"
    )

    all_symptoms = [s.get("symptom", "").lower() for s in sorted_history]
    symptom_set = set(all_symptoms)

    danger_patterns = [
        (["fever", "cough", "breathlessness"], "Possible respiratory infection - see doctor"),
        (["chest pain", "arm pain", "sweating"],  "Possible cardiac event - EMERGENCY"),
        (["fever", "stiff neck", "headache"],      "Possible meningitis - EMERGENCY"),
    ]

    warning = None
    for pattern, message in danger_patterns:
        if all(p in symptom_set for p in pattern):
            warning = message
            break

    return {
        "trend": trend,
        "days_tracked": len(set(s.get("date_reported") for s in sorted_history)),
        "symptom_count": len(set(all_symptoms)),
        "severity_progression": severities,
        "warning": warning
    }


def get_followup_questions(symptoms: List[str], language: str = "en") -> List[str]:
    questions = {
        "en": {
            "fever":    ["How high is the fever?", "Does it come and go or is it constant?"],
            "headache": ["Where exactly does it hurt?", "Is it throbbing or constant?"],
            "cough":    ["Is there mucus or phlegm?", "Is the cough worse at night?"],
            "default":  ["When did this start?", "Does it get worse with activity?", "Any similar episodes before?"]
        },
        "ta": {
            "fever":   ["காய்ச்சல் எவ்வளவு அதிகமாக உள்ளது?", "இடைவிடாமல் வருகிறதா?"],
            "default": ["இது எப்போது தொடங்கியது?", "முன்பு இப்படி ஆனதுண்டா?"]
        },
        "ml": {
            "fever":   ["പനി എത്ര കൂടുതലാണ്?", "അത് ഇടയ്ക്കിടെ വരുന്നുണ്ടോ?"],
            "default": ["ഇത് എപ്പോൾ തുടങ്ങി?", "മുമ്പ് ഇങ്ങനെ ഉണ്ടായിട്ടുണ്ടോ?"]
        },
        "hi": {
            "fever":   ["बुखार कितना तेज है?", "क्या यह आता-जाता रहता है?"],
            "default": ["यह कब शुरू हुआ?", "पहले भी ऐसा हुआ है?"]
        }
    }

    lang_q = questions.get(language, questions["en"])
    result = []
    for symptom in symptoms:
        s_lower = symptom.lower()
        result.extend(lang_q.get(s_lower, lang_q.get("default", [])))
    return list(set(result))[:4]