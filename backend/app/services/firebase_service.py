"""
Firebase Firestore Service
Replaces JSON file storage and MongoDB completely.
Free tier: 1GB storage, 50k reads/day, 20k writes/day — more than enough.
"""
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from app.config import settings
import json, os

_db = None

def get_db():
    global _db
    if _db is None:
        if not firebase_admin._apps:
            # Use service account JSON file
            cred_path = settings.FIREBASE_CREDENTIALS_PATH
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                # Fallback: use env var JSON string
                cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        _db = firestore.client()
    return _db


def save_session(session_id: str, data: dict) -> bool:
    try:
        db = get_db()
        data["saved_at"] = datetime.now().isoformat()
        db.collection("sessions").document(session_id).set(data)
        return True
    except Exception as e:
        print(f"Firebase save error: {e}")
        return False


def load_session(session_id: str) -> dict | None:
    try:
        db = get_db()
        doc = db.collection("sessions").document(session_id).get()
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        print(f"Firebase load error: {e}")
        return None


def list_sessions(limit: int = 20) -> list:
    try:
        db = get_db()
        docs = (
            db.collection("sessions")
            .order_by("saved_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        result = []
        for doc in docs:
            d = doc.to_dict()
            result.append({
                "session_id": doc.id,
                "saved_at": d.get("saved_at"),
                "top_condition": d.get("diagnosis", {}).get("top_conditions", [{}])[0].get("condition", ""),
                "symptoms": [s.get("symptom") for s in d.get("symptoms", [])],
                "language": d.get("language", "en"),
            })
        return result
    except Exception as e:
        print(f"Firebase list error: {e}")
        return []


def delete_session(session_id: str) -> bool:
    try:
        get_db().collection("sessions").document(session_id).delete()
        return True
    except:
        return False
