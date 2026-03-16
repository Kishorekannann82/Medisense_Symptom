from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import symptom, diagnosis, medicine, translate, history, voice, image
from app.api.routes import journey, medicine_interaction, location_route, family_route, prescription_route

app = FastAPI(title="MediSense API", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(symptom.router,              prefix="/api/symptom",        tags=["Symptoms"])
app.include_router(diagnosis.router,            prefix="/api/diagnosis",       tags=["Diagnosis"])
app.include_router(medicine.router,             prefix="/api/medicine",        tags=["Medicine"])
app.include_router(translate.router,            prefix="/api/translate",       tags=["Translate"])
app.include_router(history.router,              prefix="/api/history",         tags=["History"])
app.include_router(voice.router,                prefix="/api/voice",           tags=["Voice"])
app.include_router(image.router,                prefix="/api/image",           tags=["Image"])
app.include_router(journey.router,              prefix="/api/journey",         tags=["Journey"])
app.include_router(medicine_interaction.router, prefix="/api/medicine-check",  tags=["Medicine Check"])
app.include_router(location_route.router,       prefix="/api/location",        tags=["Location"])
app.include_router(family_route.router,         prefix="/api/family",          tags=["Family"])
app.include_router(prescription_route.router,   prefix="/api/prescription",    tags=["Prescription"])

@app.get("/")
def root():
    return {
        "status": "MediSense API v3.1",
        "features": [
            "RF+LSTM Diagnosis", "SHAP XAI", "Journey Tracker",
            "Urgency Score", "Native Voice", "Location Risk",
            "Family Vault", "Medicine Checker", "Prescription Reader"
        ]
    }