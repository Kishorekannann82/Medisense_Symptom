"""
Family Health Vault Service
Track health of all family members.
Detect if multiple members have same symptoms (possible home outbreak).
"""
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

FAMILY_DIR = Path(__file__).parent.parent.parent / "data" / "families"
FAMILY_DIR.mkdir(parents=True, exist_ok=True)


def get_vault(vault_id: str) -> Optional[Dict]:
    path = FAMILY_DIR / f"{vault_id}.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return None


def save_vault(vault: Dict) -> Dict:
    vault["updated_at"] = datetime.now().isoformat()
    path = FAMILY_DIR / f"{vault['vault_id']}.json"
    with open(path, "w") as f:
        json.dump(vault, f, indent=2, ensure_ascii=False)
    return vault


def create_vault(family_name: str) -> Dict:
    vault_id = f"family_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    vault = {
        "vault_id":    vault_id,
        "family_name": family_name,
        "created_at":  datetime.now().isoformat(),
        "updated_at":  datetime.now().isoformat(),
        "members":     [],
        "alerts":      []
    }
    return save_vault(vault)


def add_member(vault_id: str, name: str, age: int, gender: str, relation: str) -> Dict:
    vault = get_vault(vault_id)
    if not vault:
        raise ValueError("Vault not found")
    member = {
        "member_id": f"member_{len(vault['members'])+1}",
        "name":      name,
        "age":       age,
        "gender":    gender,
        "relation":  relation,   # father, mother, child, grandparent etc.
        "history":   []
    }
    vault["members"].append(member)
    return save_vault(vault)


def add_member_symptoms(vault_id: str, member_id: str, symptoms: List[Dict], diagnosis: str) -> Dict:
    vault = get_vault(vault_id)
    if not vault:
        raise ValueError("Vault not found")

    for member in vault["members"]:
        if member["member_id"] == member_id:
            member["history"].append({
                "date":      datetime.now().isoformat(),
                "symptoms":  symptoms,
                "diagnosis": diagnosis
            })
            break

    # Check for outbreak
    alerts = detect_outbreak(vault)
    vault["alerts"] = alerts

    return save_vault(vault)


def detect_outbreak(vault: Dict) -> List[Dict]:
    """
    Detect if 2+ family members have similar symptoms recently.
    This is the KEY innovation — home outbreak detection.
    """
    alerts = []
    recent_symptoms = {}  # symptom_name → [member_names]

    from datetime import datetime, timedelta
    cutoff = datetime.now() - timedelta(days=5)

    for member in vault["members"]:
        for record in member.get("history", []):
            try:
                record_date = datetime.fromisoformat(record["date"])
            except:
                continue
            if record_date < cutoff:
                continue
            for s in record.get("symptoms", []):
                sym = s["symptom"].lower()
                if sym not in recent_symptoms:
                    recent_symptoms[sym] = []
                recent_symptoms[sym].append(member["name"])

    # Alert if 2+ members share same symptom
    for symptom, members in recent_symptoms.items():
        unique_members = list(set(members))
        if len(unique_members) >= 2:
            alerts.append({
                "type":     "outbreak",
                "symptom":  symptom,
                "members":  unique_members,
                "message":  f"⚠ {len(unique_members)} family members have {symptom} — possible household transmission!",
                "action":   "Isolate affected members. Consult a doctor. Check water/food sources.",
                "severity": "high" if len(unique_members) >= 3 else "moderate"
            })

    return alerts


def get_family_summary(vault: Dict) -> Dict:
    """Get health summary for all family members."""
    summary = []
    for member in vault.get("members", []):
        last_record = member["history"][-1] if member.get("history") else None
        summary.append({
            "name":           member["name"],
            "relation":       member["relation"],
            "age":            member["age"],
            "last_diagnosis": last_record["diagnosis"] if last_record else None,
            "last_date":      last_record["date"] if last_record else None,
            "total_visits":   len(member.get("history", []))
        })
    return {
        "family_name": vault["family_name"],
        "members":     summary,
        "alerts":      vault.get("alerts", []),
        "total_members": len(vault.get("members", []))
    }