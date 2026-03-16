"""
Urgency Score Calculator
Computes 1-10 urgency score from symptoms + ML predictions + temporal data.
"""
from typing import List, Dict

# Symptoms that always mean high urgency
HIGH_URGENCY_SYMPTOMS = {
    "chest_pain": 3, "breathlessness": 3, "blood_in_sputum": 3,
    "coma": 4, "stomach_bleeding": 4, "acute_liver_failure": 3,
    "weakness_of_one_body_side": 3, "slurred_speech": 3,
    "high_fever": 2, "stiff_neck": 2, "loss_of_balance": 2,
    "altered_sensorium": 3, "spinning_movements": 1,
}

# Diseases that always need doctor
HIGH_URGENCY_DISEASES = {
    "Heart attack":  10, "Pneumonia": 8, "Tuberculosis": 8,
    "Paralysis (brain hemorrhage)": 10, "Hepatitis E": 8,
    "Alcoholic hepatitis": 7, "Dengue": 7, "Malaria": 7,
    "Typhoid": 6, "Jaundice": 6
}

URGENCY_LEVELS = [
    (3,  "Low",      "#00ff88", "🟢", "Rest at home. Stay hydrated. Try home remedies."),
    (5,  "Mild",     "#7fff00", "🟡", "Monitor symptoms. Visit clinic if no improvement in 2 days."),
    (7,  "Moderate", "#ffb800", "🟠", "Visit a clinic or doctor within 24 hours."),
    (9,  "High",     "#ff6b35", "🔴", "Seek medical attention today. Do not delay."),
    (10, "Critical", "#ff4757", "🚨", "Go to emergency room immediately or call ambulance."),
]


def calculate_urgency(
    symptoms: List[Dict],
    ml_predictions: List[Dict],
    temporal_trend: Dict = None
) -> Dict:
    score = 1

    # ── Factor 1: Symptom severity ────────────────────────
    if symptoms:
        avg_severity = sum(s.get("severity", 5) for s in symptoms) / len(symptoms)
        max_severity = max(s.get("severity", 5) for s in symptoms)
        score += avg_severity * 0.4
        score += (max_severity - 5) * 0.2

    # ── Factor 2: High-urgency symptoms present ───────────
    for s in symptoms:
        sym = s["symptom"].lower().replace(" ", "_")
        if sym in HIGH_URGENCY_SYMPTOMS:
            score += HIGH_URGENCY_SYMPTOMS[sym]

    # ── Factor 3: Disease urgency ─────────────────────────
    if ml_predictions:
        top_disease = ml_predictions[0].get("disease", "")
        top_conf    = ml_predictions[0].get("confidence", 0)
        if top_disease in HIGH_URGENCY_DISEASES:
            score += HIGH_URGENCY_DISEASES[top_disease] * top_conf

    # ── Factor 4: Temporal worsening ─────────────────────
    if temporal_trend:
        if temporal_trend.get("trend") == "worsening":
            score += 1.5
        days = temporal_trend.get("days_tracked", 1)
        if days >= 3 and temporal_trend.get("trend") != "improving":
            score += 1  # symptoms persisting 3+ days

    # ── Factor 5: Duration ────────────────────────────────
    if symptoms:
        max_days = max(s.get("duration_days", 1) for s in symptoms)
        if max_days >= 7:
            score += 1
        elif max_days >= 3:
            score += 0.5

    # ── Clamp to 1-10 ─────────────────────────────────────
    score = max(1, min(10, round(score)))

    # ── Find urgency level ────────────────────────────────
    level = URGENCY_LEVELS[-1]
    for threshold, label, color, icon, action in URGENCY_LEVELS:
        if score <= threshold:
            level = (threshold, label, color, icon, action)
            break

    _, label, color, icon, action = level

    return {
        "urgency_score":  score,
        "urgency_label":  label,
        "urgency_color":  color,
        "urgency_icon":   icon,
        "urgency_action": action,
        "see_doctor":     score >= 6
    }