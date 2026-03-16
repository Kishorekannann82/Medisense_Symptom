from fastapi import APIRouter, HTTPException
from app.services.firebase_service import list_sessions, load_session, delete_session

router = APIRouter()

@router.get("/all")
async def get_all_sessions():
    return {"sessions": list_sessions()}

@router.get("/{session_id}")
async def get_session(session_id: str):
    data = load_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
    return data

@router.delete("/{session_id}")
async def remove_session(session_id: str):
    if delete_session(session_id):
        return {"message": "Deleted"}
    raise HTTPException(status_code=404, detail="Session not found")
