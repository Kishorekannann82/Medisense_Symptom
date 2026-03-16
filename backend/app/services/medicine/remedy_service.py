"""
Home Remedy + OTC Medicine Service
Maps conditions to safe home remedies and over-the-counter medicines.
"""
import json
from pathlib import Path
from typing import List, Dict

# Inline starter data — replace with loaded JSON from /data/medicine/ later
HOME_REMEDIES = {
    "fever": {
        "en": [
            {"remedy": "Cold compress", "instructions": "Place a wet cloth on forehead for 10 min", "ingredients": ["water", "cloth"]},
            {"remedy": "Ginger tea", "instructions": "Boil ginger in water, drink warm with honey", "ingredients": ["ginger", "water", "honey"]},
        ],
        "ta": [
            {"remedy": "நெற்றியில் குளிர் துணி", "instructions": "நனைத்த துணியை நெற்றியில் 10 நிமிடம் வையுங்கள்", "ingredients": ["தண்ணீர்", "துணி"]},
            {"remedy": "இஞ்சி தேநீர்", "instructions": "இஞ்சியை தண்ணீரில் கொதிக்க வைத்து தேனுடன் குடியுங்கள்", "ingredients": ["இஞ்சி", "தண்ணீர்", "தேன்"]},
        ],
        "ml": [
            {"remedy": "തണുത്ത തുണി", "instructions": "നനഞ്ഞ തുണി നെറ്റിയിൽ 10 മിനിറ്റ് വയ്ക്കുക", "ingredients": ["വെള്ളം", "തുണി"]},
        ]
    },
    "common cold": {
        "en": [
            {"remedy": "Steam inhalation", "instructions": "Inhale steam for 5-10 min, twice daily", "ingredients": ["hot water"]},
            {"remedy": "Honey and ginger", "instructions": "Mix honey with ginger juice, take 2 spoons twice daily", "ingredients": ["honey", "ginger"]},
        ],
        "ta": [
            {"remedy": "ஆவி பிடிக்கவும்", "instructions": "சூடான தண்ணீரில் ஆவியை 5-10 நிமிடம் சுவாசியுங்கள்", "ingredients": ["சூடான தண்ணீர்"]},
        ]
    },
    "headache": {
        "en": [
            {"remedy": "Peppermint oil", "instructions": "Apply peppermint oil on temples and forehead gently", "ingredients": ["peppermint oil"]},
            {"remedy": "Rest in dark room", "instructions": "Lie down in a quiet dark room for 20 minutes", "ingredients": []},
        ]
    }
}

OTC_MEDICINES = {
    "fever": [
        {"name": "Paracetamol", "generic_name": "Acetaminophen", "dosage": "500mg - 1g", "frequency": "Every 6-8 hours", "warnings": ["Do not exceed 4g per day"], "not_for": ["liver disease patients"]},
        {"name": "Ibuprofen", "generic_name": "Ibuprofen", "dosage": "400mg", "frequency": "Every 8 hours with food", "warnings": ["Take with food"], "not_for": ["stomach ulcer", "kidney disease", "pregnant women"]}
    ],
    "common cold": [
        {"name": "Cetirizine", "generic_name": "Cetirizine HCl", "dosage": "10mg", "frequency": "Once daily at night", "warnings": ["May cause drowsiness"], "not_for": ["children under 6"]},
    ],
    "headache": [
        {"name": "Paracetamol", "generic_name": "Acetaminophen", "dosage": "500mg", "frequency": "Every 6 hours as needed", "warnings": ["Do not take with alcohol"], "not_for": ["liver disease patients"]},
    ],
    "acidity": [
        {"name": "Antacid (Gelusil/Digene)", "generic_name": "Aluminium hydroxide", "dosage": "2 tablets", "frequency": "After meals", "warnings": ["Short term use only"], "not_for": []},
    ]
}

DISCLAIMERS = {
    "en": "These are general suggestions only. Always consult a doctor if symptoms worsen or persist beyond 3 days. Do not self-medicate for children under 12.",
    "ta": "இவை பொதுவான ஆலோசனைகள் மட்டுமே. அறிகுறிகள் மோசமாகினால் உடனே மருத்துவரை சந்தியுங்கள். 12 வயதுக்கு உட்பட்ட குழந்தைகளுக்கு சுயமாக மருந்து கொடுக்காதீர்கள்.",
    "ml": "ഇവ പൊതുവായ നിർദ്ദേശങ്ങൾ മാത്രമാണ്. ലക്ഷണങ്ങൾ വഷളായാൽ ഉടൻ ഡോക്ടറെ കാണുക.",
    "hi": "ये केवल सामान्य सुझाव हैं। लक्षण बिगड़ने पर तुरंत डॉक्टर से मिलें।"
}

def get_remedies(condition: str, language: str = "en") -> Dict:
    condition_lower = condition.lower()
    match_key = None
    for key in HOME_REMEDIES:
        if key in condition_lower:
            match_key = key
            break

    remedies = HOME_REMEDIES.get(match_key, {}).get(language) or HOME_REMEDIES.get(match_key, {}).get("en", [])
    medicines = OTC_MEDICINES.get(match_key, [])
    disclaimer = DISCLAIMERS.get(language, DISCLAIMERS["en"])

    return {
        "condition": condition,
        "home_remedies": remedies,
        "otc_medicines": medicines,
        "disclaimer": disclaimer,
        "language": language
    }
