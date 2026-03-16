"""
FREE Translation Service — No billing, no API key needed!
Uses deep-translator library which wraps:
  1. MyMemory (primary)   — 5000 chars/day free, no key needed
  2. LibreTranslate       — open source, self-hostable, free
  3. Groq LLaMA fallback  — already free in your project

Install: pip install deep-translator
"""

from deep_translator import MyMemoryTranslator, LibreTranslator
from app.services.ai.groq_service import client
from app.config import settings

# Language code mapping
LANG_MAP = {
    "ta": "ta-IN",   # Tamil
    "ml": "ml-IN",   # Malayalam
    "hi": "hi-IN",   # Hindi
    "te": "te-IN",   # Telugu
    "kn": "kn-IN",   # Kannada
    "en": "en-GB",   # English
}

LANG_NAMES = {
    "ta": "Tamil",
    "ml": "Malayalam",
    "hi": "Hindi",
    "te": "Telugu",
    "kn": "Kannada",
    "en": "English",
}


def translate_with_mymemory(text: str, target_lang: str) -> str:
    """
    MyMemory — completely free, no API key.
    Limit: 5000 chars/day (enough for a student project).
    """
    try:
        src = "en-GB"
        tgt = LANG_MAP.get(target_lang, target_lang)
        translated = MyMemoryTranslator(source=src, target=tgt).translate(text)
        return translated or text
    except Exception as e:
        print(f"MyMemory error: {e}")
        return None


def translate_with_groq(text: str, target_lang: str) -> str:
    """
    Groq LLaMA as translator — already free in your project.
    Best quality for Indian languages. No extra key needed.
    """
    lang_name = LANG_NAMES.get(target_lang, target_lang)
    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{
                "role": "user",
                "content": (
                    f"Translate this medical text to {lang_name}.\n"
                    f"Use simple everyday words a normal person understands.\n"
                    f"Return ONLY the translated text, nothing else.\n\n"
                    f"Text: {text}"
                )
            }],
            temperature=0.1,
            max_tokens=500
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq translate error: {e}")
        return text


def translate_text(text: str, target_lang: str) -> str:
    """
    Main translation function.
    Tries MyMemory first → falls back to Groq LLaMA.
    Both are completely free.
    """
    if target_lang == "en":
        return text

    # Try MyMemory first (fast, free)
    result = translate_with_mymemory(text, target_lang)
    if result and result != text:
        return result

    # Fallback to Groq (higher quality, already free)
    return translate_with_groq(text, target_lang)


def detect_language(text: str) -> str:
    """
    Detect language of input text using Groq.
    Returns language code: en, ta, ml, hi, te, kn
    """
    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{
                "role": "user",
                "content": (
                    f"Detect the language of this text and return ONLY the 2-letter "
                    f"language code (en/ta/ml/hi/te/kn).\nText: {text}"
                )
            }],
            temperature=0,
            max_tokens=5
        )
        code = response.choices[0].message.content.strip().lower()[:2]
        return code if code in LANG_MAP else "en"
    except:
        return "en"
