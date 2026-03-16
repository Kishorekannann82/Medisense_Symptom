from fastapi import APIRouter
router = APIRouter()

@router.get("/list")
async def get_symptom_list():
    """Return list of common symptoms for autocomplete."""
    symptoms = [
        "Fever", "Headache", "Cough", "Cold", "Sore throat",
        "Body ache", "Fatigue", "Nausea", "Vomiting", "Diarrhea",
        "Stomach pain", "Chest pain", "Breathlessness", "Dizziness",
        "Skin rash", "Itching", "Swelling", "Back pain", "Joint pain",
        "Loss of appetite", "Chills", "Sweating", "Runny nose"
    ]
    return {"symptoms": symptoms}
