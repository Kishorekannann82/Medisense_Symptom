"""
MediSense — Kaggle Dataset Downloader (requests-based, works with kaggle 2.0)
Run: python download_datasets.py  (from backend/data/ folder)
"""

import os, json, zipfile, io
from pathlib import Path
import requests

USERNAME = "kishorekanna"
API_KEY  = "KGAT_6fedac7fc0758fa3b22182c120c2092e"

BASE   = Path(__file__).parent.parent.parent / "data"
GREEN  = "\033[92m"; YELLOW = "\033[93m"; RED = "\033[91m"; RESET = "\033[0m"
def ok(m):   print(f"{GREEN}  ✓ {m}{RESET}")
def info(m): print(f"{YELLOW}  → {m}{RESET}")
def err(m):  print(f"{RED}  ✗ {m}{RESET}")
def head(m): print(f"\n{YELLOW}━━ {m} ━━{RESET}")

def download(dataset, dest, label):
    dest.mkdir(parents=True, exist_ok=True)
    info(f"Downloading {label}...")

    owner, name = dataset.split("/")
    url = f"https://www.kaggle.com/api/v1/datasets/download/{owner}/{name}"

    try:
        r = requests.get(url, auth=(USERNAME, API_KEY), stream=True, timeout=120)
        if r.status_code != 200:
            err(f"HTTP {r.status_code} — {label}")
            return False

        total = int(r.headers.get("Content-Length", 0))
        downloaded = 0
        chunks = []
        for chunk in r.iter_content(chunk_size=8192):
            chunks.append(chunk)
            downloaded += len(chunk)
            if total:
                pct = int(downloaded / total * 100)
                print(f"\r    {pct}% ({downloaded//1024} KB)", end="", flush=True)
        print()

        # Extract zip
        zip_bytes = b"".join(chunks)
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            z.extractall(dest)

        files = list(dest.glob("*.csv")) + list(dest.glob("*.json"))
        for f in files:
            ok(f"{f.name}  ({f.stat().st_size // 1024} KB)")
        return True

    except Exception as e:
        err(f"Error: {e}")
        return False


print(f"\n{GREEN}╔══════════════════════════════════════╗")
print(f"║   MediSense Dataset Downloader       ║")
print(f"╚══════════════════════════════════════╝{RESET}")

head("Disease Symptom Dataset  (41 diseases, 132 symptoms)")
download("itachi9604/disease-symptom-description-dataset",
         BASE / "symptom_disease", "Disease-Symptom-Description")

head("Medicine Recommendation Dataset")
download("noorsaeed/medicine-recommendation-system-dataset",
         BASE / "medicine", "Medicine-Recommendation")

head("Medical QA Dataset")
download("thedevastator/comprehensive-medical-q-a-dataset",
         BASE / "medical_qa", "Medical-QA")

head("Built-in Multilingual Vocabulary")
ml_dir = BASE / "multilingual"
ml_dir.mkdir(parents=True, exist_ok=True)
vocab = {
    "symptoms": {
        "fever":            {"ta": "காய்ச்சல்",       "ml": "പനി",            "hi": "बुखार"},
        "headache":         {"ta": "தலைவலி",          "ml": "തലവേദന",         "hi": "सिरदर्द"},
        "cough":            {"ta": "இருமல்",           "ml": "ചുമ",             "hi": "खांसी"},
        "cold":             {"ta": "சளி",              "ml": "ജലദോഷം",         "hi": "जुकाम"},
        "body ache":        {"ta": "உடல்வலி",          "ml": "ശരീരവേദന",       "hi": "बदन दर्द"},
        "fatigue":          {"ta": "சோர்வு",           "ml": "ക്ഷീണം",          "hi": "थकान"},
        "nausea":           {"ta": "குமட்டல்",         "ml": "ഓക്കാനം",        "hi": "मतली"},
        "vomiting":         {"ta": "வாந்தி",           "ml": "ഛർദ്ദி",         "hi": "उल्टी"},
        "diarrhea":         {"ta": "வயிற்றுப்போக்கு", "ml": "വയറിളക്കം",      "hi": "दस्त"},
        "stomach pain":     {"ta": "வயிற்று வலி",      "ml": "വയർ വേദന",       "hi": "पेट दर्द"},
        "chest pain":       {"ta": "நெஞ்சு வலி",      "ml": "നെഞ്ചുവേദന",     "hi": "सीने में दर्द"},
        "dizziness":        {"ta": "தலைசுற்றல்",      "ml": "തലകറക്കം",       "hi": "चक्कर"},
        "breathlessness":   {"ta": "மூச்சுத்திணறல்",  "ml": "ശ്വാസതടസ്സം",    "hi": "सांस की तकलीफ"},
        "skin rash":        {"ta": "தோல் வெடிப்பு",   "ml": "ചർമ്മ പാടുകൾ",  "hi": "त्वचा पर चकत्ते"},
        "itching":          {"ta": "அரிப்பு",          "ml": "ചൊറിച്ചിൽ",     "hi": "खुजली"},
        "sore throat":      {"ta": "தொண்டை வலி",      "ml": "തൊണ്ടവേദന",      "hi": "गले में दर्द"},
        "back pain":        {"ta": "முதுகு வலி",       "ml": "നടുവേദന",         "hi": "पीठ दर्द"},
        "joint pain":       {"ta": "மூட்டு வலி",       "ml": "സന്ധിവേദന",      "hi": "जोड़ों में दर्द"},
        "swelling":         {"ta": "வீக்கம்",          "ml": "നീർക്കെട്ട്",    "hi": "सूजन"},
        "loss of appetite": {"ta": "பசியின்மை",        "ml": "വിശപ്പില്ലായ്മ", "hi": "भूख न लगना"},
    }
}
with open(ml_dir / "medical_vocabulary.json", "w", encoding="utf-8") as f:
    json.dump(vocab, f, ensure_ascii=False, indent=2)
ok("medical_vocabulary.json created")

print(f"\n{GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print(f"  Done! Next: python preprocess.py")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")