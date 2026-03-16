from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Groq (free) — https://console.groq.com
    GROQ_API_KEY: str = ""

    # Firebase (free) — https://console.firebase.google.com
    FIREBASE_CREDENTIALS_PATH: str = "firebase_credentials.json"
    FIREBASE_CREDENTIALS_JSON: str = ""   # alternative: paste JSON as string

    # Google Translate (free 500k chars/month) — https://console.cloud.google.com
    GOOGLE_TRANSLATE_KEY: str = ""

    # App
    SECRET_KEY: str = "change-this-in-production"
    DEBUG: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
