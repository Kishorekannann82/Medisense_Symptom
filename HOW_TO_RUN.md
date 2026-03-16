# MediSense — Complete Setup Guide
======================================

## STEP 1 — Get FREE API Keys (only 2 needed)

### A) Groq API Key  (FREE — No card needed)
  1. Go to    → https://console.groq.com
  2. Sign Up  → free, no credit card
  3. Click    → API Keys → Create Key
  4. Copy key → paste in backend/.env as GROQ_API_KEY

### B) Firebase  (FREE — No card needed)
  1. Go to  → https://console.firebase.google.com
  2. Click  → Add Project → name it medisense → Continue
  3. Disable Google Analytics → Create Project

  ── Service Account (for backend) ──
  4. Click ⚙ gear → Project Settings → Service Accounts tab
  5. Click → Generate New Private Key → Download JSON
  6. Rename file to → firebase_credentials.json
  7. Paste it inside → medisense/backend/ folder

  ── Web Config (for frontend) ──
  8. In Project Settings → Your Apps → click </> (Web)
  9. Register app → name it medisense-web
  10. Copy the firebaseConfig values → paste in frontend/.env

  ── Enable Firestore ──
  11. Left menu → Firestore Database → Create Database
  12. Choose → Start in Test Mode → select region → Enable

### C) Translation — NO KEY NEEDED
  Uses deep-translator (MyMemory) + Groq fallback.
  Both are completely free. Nothing to set up.

---

## STEP 2 — Download All Datasets (ONE command)

No manual Kaggle setup. No account needed. Just run:

  cd medisense
  python backend/data/download_datasets.py

This automatically downloads and saves everything into:

  data/
  ├── symptom_disease/
  │   ├── dataset.csv               ← 41 diseases, symptoms
  │   ├── symptom_severity.csv      ← severity weights
  │   ├── symptom_description.csv   ← disease descriptions
  │   └── symptom_precaution.csv    ← precautions per disease
  │
  ├── medicine/
  │   ├── medicine_recommendation.csv
  │   ├── diets.csv
  │   ├── workout.csv
  │   ├── precautions.csv
  │   ├── home_remedies.json        ← Tamil/Malayalam/Hindi built-in
  │   └── otc_medicines.json        ← OTC medicine database
  │
  ├── medical_qa/
  │   └── medical_qa.csv            ← NIH MedQuAD QA pairs
  │
  └── multilingual/
      └── medical_vocabulary.json   ← 20 symptoms in 4 languages

Then process the raw CSVs:

  python backend/data/preprocess.py

This creates clean JSON files in backend/data/processed/ for the AI to use.

---

## STEP 3 — Fill in .env Files

  backend/.env
  ├── GROQ_API_KEY         = (from Step 1A)
  └── FIREBASE_CREDENTIALS_PATH = firebase_credentials.json

  frontend/.env
  ├── VITE_API_URL                    = http://localhost:8000
  ├── VITE_FIREBASE_API_KEY           = (from Step 1B)
  ├── VITE_FIREBASE_AUTH_DOMAIN       = your-project.firebaseapp.com
  ├── VITE_FIREBASE_PROJECT_ID        = your-project-id
  ├── VITE_FIREBASE_STORAGE_BUCKET    = your-project.appspot.com
  ├── VITE_FIREBASE_MESSAGING_SENDER_ID = 1234567890
  └── VITE_FIREBASE_APP_ID            = 1:xxx:web:xxx

---

## STEP 4 — Run the Project

  Terminal 1 — Backend:
    cd medisense/backend
    python -m venv venv
    venv\Scripts\activate          (Windows)
    source venv/bin/activate       (Mac/Linux)
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

  Terminal 2 — Frontend:
    cd medisense/frontend
    npm install
    npm run dev

  Open browser → http://localhost:5173

---

## What You Get

  ✓ Symptom input in Tamil / Malayalam / Hindi / English
  ✓ Voice input (speak your symptoms)
  ✓ Image upload (skin/eye/tongue analysis)
  ✓ AI diagnosis with plain-language explanation
  ✓ Home remedies in your language
  ✓ OTC medicine suggestions with dosage
  ✓ XAI explanation (why the AI thinks this)
  ✓ Doctor alert for serious conditions
  ✓ Session history saved to Firebase
  ✓ Works on mobile browser too

