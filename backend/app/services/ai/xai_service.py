"""
XAI (Explainable AI) Service
Uses SHAP to explain which symptoms contributed most to a diagnosis.
"""
import numpy as np
from typing import List, Dict

def calculate_shap_weights(symptoms: List[Dict], condition: str, key_symptoms: List[str]) -> List[Dict]:
    """
    Simplified SHAP-style explanation.
    In production, replace with actual SHAP library on your trained ML model.
    """
    explanations = []
    total_symptoms = len(symptoms)

    for entry in symptoms:
        symptom_name = entry["symptom"]
        severity = entry["severity"]
        duration = entry["duration_days"]

        # Weight calculation: severity + duration + whether it's a key symptom
        base_weight = (severity / 10) * 0.5 + min(duration / 7, 1.0) * 0.3
        key_bonus = 0.2 if symptom_name.lower() in [k.lower() for k in key_symptoms] else 0.0
        weight = round(base_weight + key_bonus, 3)

        if weight >= 0.6:
            impact = "high"
        elif weight >= 0.3:
            impact = "medium"
        else:
            impact = "low"

        explanations.append({
            "symptom": symptom_name,
            "weight": weight,
            "impact": impact
        })

    # Sort by weight descending
    return sorted(explanations, key=lambda x: x["weight"], reverse=True)


def format_xai_for_user(explanations: List[Dict], language: str) -> str:
    """Format XAI output in plain language per selected language."""
    top = [e for e in explanations if e["impact"] == "high"]
    if not top:
        top = explanations[:2]

    symptom_names = ", ".join([e["symptom"] for e in top])

    messages = {
        "en": f"This condition was identified mainly because of: {symptom_names}",
        "ta": f"இந்த நோய் கண்டறியப்பட்டதற்கு முக்கிய காரணம்: {symptom_names}",
        "ml": f"ഈ അവസ്ഥ തിരിച്ചറിഞ്ഞത് പ്രധാനമായും ഇവ കൊണ്ടാണ്: {symptom_names}",
        "hi": f"यह स्थिति मुख्य रूप से इन कारणों से पहचानी गई: {symptom_names}",
    }
    return messages.get(language, messages["en"])
