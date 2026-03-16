"""
Symptom Journey Tracker Service
Tracks multi-day symptom progression and detects escalation patterns.
"""
import json
from datetime import datetime, date
from pathlib import Path
from typing import List, Dict, Optional

# Journey stored in local JSON file (also saved to Firebase)
JOURNEY_DIR = Path(__file__).parent.parent.parent / "data" / "journeys"
JOURNEY_DIR.mkdir(parents=True, exist_ok=True)


def get_journey(journey_id: str) -> Optional[Dict]:
    path = JOURNEY_DIR / f"{journey_id}.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return None


def save_journey(journey: Dict) -> Dict:
    path = JOURNEY_DIR / f"{journey['journey_id']}.json"
    journey["updated_at"] = datetime.now().isoformat()
    with open(path, "w") as f:
        json.dump(journey, f, indent=2)
    return journey


def create_journey(patient_info: Dict) -> Dict:
    journey_id = f"journey_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    journey = {
        "journey_id":   journey_id,
        "created_at":   datetime.now().isoformat(),
        "updated_at":   datetime.now().isoformat(),
        "patient":      patient_info,
        "days":         [],
        "status":       "active",   # active | resolved | escalated
        "language":     patient_info.get("language", "en")
    }
    return save_journey(journey)


def add_day_entry(journey_id: str, symptoms: List[Dict], notes: str = "") -> Dict:
    journey = get_journey(journey_id)
    if not journey:
        raise ValueError(f"Journey {journey_id} not found")

    day_num = len(journey["days"]) + 1
    entry = {
        "day":          day_num,
        "date":         date.today().isoformat(),
        "symptoms":     symptoms,
        "notes":        notes,
        "added_at":     datetime.now().isoformat()
    }
    journey["days"].append(entry)
    return save_journey(journey)


def analyse_journey_trend(journey: Dict) -> Dict:
    """
    Analyse multi-day symptom progression.
    Returns trend, urgency escalation, and danger patterns.
    """
    days = journey.get("days", [])
    if not days:
        return {"trend": "no_data", "urgency": 1, "escalation": False}

    # ── Collect all symptoms across days ─────────────────
    all_symptom_names = set()
    severity_by_day = []

    for day in days:
        syms = day.get("symptoms", [])
        avg_sev = sum(s.get("severity", 5) for s in syms) / max(len(syms), 1)
        severity_by_day.append(avg_sev)
        for s in syms:
            all_symptom_names.add(s["symptom"].lower().replace(" ", "_"))

    # ── Trend detection ───────────────────────────────────
    if len(severity_by_day) >= 2:
        if severity_by_day[-1] > severity_by_day[0] + 1:
            trend = "worsening"
        elif severity_by_day[-1] < severity_by_day[0] - 1:
            trend = "improving"
        else:
            trend = "stable"
    else:
        trend = "monitoring"

    # ── New symptoms appearing (bad sign) ─────────────────
    new_symptoms_today = []
    if len(days) >= 2:
        prev_syms = set(s["symptom"].lower() for s in days[-2]["symptoms"])
        curr_syms = set(s["symptom"].lower() for s in days[-1]["symptoms"])
        new_symptoms_today = list(curr_syms - prev_syms)

    # ── Danger pattern detection ──────────────────────────
    DANGER_PATTERNS = [
        {
            "symptoms": ["chest_pain", "sweating", "breathlessness"],
            "message":  "Possible cardiac emergency",
            "urgency":  10,
            "action":   "Call ambulance immediately — do not wait"
        },
        {
            "symptoms": ["fever", "stiff_neck", "headache", "vomiting"],
            "message":  "Possible meningitis",
            "urgency":  10,
            "action":   "Go to emergency room immediately"
        },
        {
            "symptoms": ["high_fever", "breathlessness", "cough"],
            "message":  "Possible severe respiratory infection",
            "urgency":  8,
            "action":   "Visit hospital today"
        },
        {
            "symptoms": ["high_fever", "skin_rash", "joint_pain"],
            "message":  "Possible dengue fever",
            "urgency":  8,
            "action":   "Get blood test done today"
        },
        {
            "symptoms": ["yellowish_skin", "dark_urine", "fatigue"],
            "message":  "Possible jaundice/hepatitis",
            "urgency":  7,
            "action":   "Visit doctor within 24 hours"
        },
        {
            "symptoms": ["chills", "high_fever", "sweating"],
            "message":  "Possible malaria",
            "urgency":  7,
            "action":   "Get malaria test done today"
        },
    ]

    danger_alert = None
    max_urgency  = 1

    for pattern in DANGER_PATTERNS:
        matches = sum(1 for p in pattern["symptoms"] if p in all_symptom_names)
        if matches >= 2:
            if pattern["urgency"] > max_urgency:
                max_urgency  = pattern["urgency"]
                danger_alert = pattern

    # ── Base urgency from severity trend ─────────────────
    base_urgency = min(int(max(severity_by_day) * 1.1), 10) if severity_by_day else 1

    # ── Escalation factors ────────────────────────────────
    if trend == "worsening":
        base_urgency = min(base_urgency + 2, 10)
    if len(new_symptoms_today) >= 2:
        base_urgency = min(base_urgency + 1, 10)
    if len(days) >= 3 and trend != "improving":
        base_urgency = min(base_urgency + 1, 10)  # symptoms persist 3+ days

    final_urgency = max(base_urgency, max_urgency)
    escalation    = final_urgency >= 7

    # ── Urgency label + color ─────────────────────────────
    if final_urgency <= 3:
        urgency_label = "Low"
        urgency_color = "#00ff88"
        urgency_action = "Rest at home. Drink water, try home remedies."
    elif final_urgency <= 6:
        urgency_label = "Moderate"
        urgency_color = "#ffb800"
        urgency_action = "Monitor closely. Visit clinic within 1-2 days if no improvement."
    else:
        urgency_label = "High"
        urgency_color = "#ff4757"
        urgency_action = danger_alert["action"] if danger_alert else "Seek medical attention today."

    return {
        "trend":            trend,
        "urgency_score":    final_urgency,
        "urgency_label":    urgency_label,
        "urgency_color":    urgency_color,
        "urgency_action":   urgency_action,
        "escalation":       escalation,
        "danger_alert":     danger_alert,
        "new_symptoms":     new_symptoms_today,
        "days_tracked":     len(days),
        "severity_trend":   severity_by_day,
        "total_symptoms":   len(all_symptom_names)
    }


def list_journeys() -> List[Dict]:
    journeys = []
    for f in JOURNEY_DIR.glob("*.json"):
        with open(f) as j:
            data = json.load(j)
            journeys.append({
                "journey_id": data["journey_id"],
                "created_at": data["created_at"],
                "days":       len(data.get("days", [])),
                "status":     data.get("status", "active")
            })
    return sorted(journeys, key=lambda x: x["created_at"], reverse=True)[:20]