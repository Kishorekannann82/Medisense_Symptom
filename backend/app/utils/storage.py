"""
Simple JSON file-based storage — no database needed.
Saves session history as JSON files in /data/sessions/
"""
import json
import os
from datetime import datetime
from pathlib import Path

SESSIONS_DIR = Path(__file__).parent.parent.parent.parent / "data" / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

def save_session(session_id: str, data: dict) -> bool:
    try:
        data["saved_at"] = datetime.now().isoformat()
        file_path = SESSIONS_DIR / f"{session_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Save error: {e}")
        return False

def load_session(session_id: str) -> dict | None:
    file_path = SESSIONS_DIR / f"{session_id}.json"
    if not file_path.exists():
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def list_sessions(limit: int = 20) -> list:
    files = sorted(SESSIONS_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)
    sessions = []
    for f in files[:limit]:
        try:
            with open(f, "r", encoding="utf-8") as fp:
                d = json.load(fp)
                sessions.append({
                    "session_id": f.stem,
                    "saved_at": d.get("saved_at"),
                    "symptoms": d.get("symptoms", []),
                    "top_condition": d.get("diagnosis", {}).get("top_conditions", [{}])[0].get("condition", ""),
                    "language": d.get("language", "en")
                })
        except:
            continue
    return sessions

def delete_session(session_id: str) -> bool:
    file_path = SESSIONS_DIR / f"{session_id}.json"
    if file_path.exists():
        file_path.unlink()
        return True
    return False
