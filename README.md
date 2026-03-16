<div align="center">

# 🩺 MediSense
### Multilingual Intelligent Symptom Checker with Explainable AI

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-cyan?logo=react)](https://react.dev)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange?logo=tensorflow)](https://tensorflow.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**A final year project targeting publication in IEEE Access / Computers in Biology and Medicine**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [Models](#-ml-models) • [Screenshots](#-screenshots)

</div>

---

## 📌 Overview

MediSense is a **multilingual, multimodal, AI-powered symptom checker** designed for rural and semi-urban India. It addresses a critical gap — millions of Indians cannot access timely medical advice due to language barriers, distance from hospitals, and lack of health literacy.

### 🎯 Problem Statement
- 65% of India's population lives in rural areas with limited healthcare access
- Most symptom checkers are English-only and require medical literacy
- No existing free tool tracks symptom progression over multiple days
- Medicine interaction checking is unavailable in local languages

### 💡 Solution
MediSense provides instant, explainable, multilingual health guidance using a hybrid RF+LSTM model pipeline with SHAP-based explainability — accessible via text, voice, or image in Tamil, Malayalam, Hindi, and English.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Hybrid ML Diagnosis** | Random Forest (98.9%) + LSTM Temporal (100%) ensemble |
| 🔍 **SHAP Explainability** | Visual explanation of why each symptom points to a disease |
| 🌐 **4 Languages** | Tamil, Malayalam, Hindi, English — UI + diagnosis output |
| 🎙 **Native Voice Input** | Speak symptoms in Tamil/Malayalam/Hindi directly |
| 📷 **Image Analysis** | Upload skin/eye/tongue photo for visual diagnosis |
| 📅 **Journey Tracker** | Multi-day symptom progression with escalation alerts |
| 🚨 **Urgency Score** | 1–10 urgency rating with color-coded action guidance |
| 👨‍👩‍👧 **Family Health Vault** | Track whole family, detect household outbreaks |
| 💊 **Medicine Checker** | Check drug interactions with Indian brand names |
| 📄 **Prescription Reader** | Photo your prescription — AI reads all medicines |
| 🌍 **Location Risk** | Geo-aware disease risk based on region and season |

---

## 🏗 Architecture

```
User Input (Text / Voice / Image / Prescription)
           │
           ▼
┌─────────────────────────────────────────────┐
│           MediSense Backend (FastAPI)        │
│                                             │
│  ┌─────────────┐    ┌─────────────────────┐ │
│  │ Random      │    │  LSTM Temporal      │ │
│  │ Forest      │───▶│  Progression Model  │ │
│  │ (98.9%)     │    │  (100%)             │ │
│  └─────────────┘    └─────────────────────┘ │
│           │                   │             │
│           └────────┬──────────┘             │
│                    ▼                        │
│           ┌─────────────────┐               │
│           │  SHAP XAI       │               │
│           │  Explainer      │               │
│           └─────────────────┘               │
│                    │                        │
│                    ▼                        │
│           ┌─────────────────┐               │
│           │  Groq LLaMA 3.3 │               │
│           │  (Plain Lang.)  │               │
│           └─────────────────┘               │
│                    │                        │
│           ┌────────▼────────┐               │
│           │  Urgency Score  │               │
│           │  Calculator     │               │
│           └─────────────────┘               │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│        React Frontend (Vite + Tailwind)      │
│  Dark theme · Multilingual · Responsive     │
└─────────────────────────────────────────────┘
```

---

## 🧠 ML Models

| Model | Algorithm | Accuracy | Purpose |
|-------|-----------|----------|---------|
| Model 1 | Random Forest (200 trees) | **98.9%** | Primary disease classification |
| Model 2 | SVM (RBF kernel) | **98.7%** | Comparison baseline |
| Model 3 | LSTM (2-layer, 128+64 units) | **100%** | Temporal symptom progression |

**Dataset:** 41 diseases · 131 symptoms · 4,920 training samples (Kaggle Disease-Symptom Dataset)

**XAI:** SHAP TreeExplainer — per-symptom contribution scores for every diagnosis

---

## 📁 Project Structure

```
medisense/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app — all routes registered
│   │   ├── config.py                  # Settings (Groq key, Firebase path)
│   │   ├── api/routes/
│   │   │   ├── diagnosis.py           # POST /api/diagnosis/analyse
│   │   │   ├── voice.py               # POST /api/voice/transcribe (Whisper)
│   │   │   ├── image.py               # POST /api/image/analyse (LLaMA Vision)
│   │   │   ├── journey.py             # Multi-day symptom journey
│   │   │   ├── medicine_interaction.py# Drug interaction checker
│   │   │   ├── prescription_route.py  # Prescription photo reader
│   │   │   ├── family_route.py        # Family health vault
│   │   │   └── location_route.py      # Location-based disease risk
│   │   └── services/
│   │       ├── ai/
│   │       │   ├── diagnosis_engine.py # RF + LSTM hybrid prediction
│   │       │   ├── groq_service.py     # LLaMA plain language explanation
│   │       │   ├── temporal_model.py   # Progression analysis
│   │       │   └── xai_service.py      # SHAP weights
│   │       ├── family_service.py       # Family vault logic
│   │       ├── journey_service.py      # Journey tracking
│   │       ├── location_service.py     # Geo disease risk
│   │       └── urgency_service.py      # Urgency 1-10 scoring
│   └── data/
│       ├── download_datasets.py        # One-command Kaggle download
│       ├── preprocess.py               # CSV → JSON processing
│       └── models/                     # Trained model files (git-ignored)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx                # Main symptom checker
│       │   ├── Results.jsx             # Diagnosis results + urgency
│       │   ├── JourneyTracker.jsx      # Multi-day tracker
│       │   ├── MedicineChecker.jsx     # Drug interaction + prescription
│       │   ├── FamilyVault.jsx         # Family health management
│       │   └── History.jsx             # Past sessions
│       └── components/
│           ├── symptom/
│           │   ├── SymptomInput.jsx    # Smart popup symptom picker
│           │   ├── VoiceInput.jsx      # Native language voice
│           │   └── ImageUpload.jsx     # Medical image analysis
│           └── common/
│               └── Navbar.jsx          # Navigation
├── notebooks/
│   ├── 02_symptom_model.ipynb          # RF + SVM + SHAP training
│   └── 03_temporal_lstm.ipynb          # LSTM temporal training
└── README.md
```

---

## 🚀 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Conda (recommended)
- Groq API key (free) — https://console.groq.com

### Step 1 — Clone & Setup Environment

```bash
git clone https://github.com/YOUR_USERNAME/medisense.git
cd medisense

conda create -n medisense python=3.11
conda activate medisense
```

### Step 2 — Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
FIREBASE_CREDENTIALS_PATH=firebase_credentials.json
```

### Step 3 — Download & Process Datasets

```bash
cd backend/data
python download_datasets.py
python preprocess.py
```

### Step 4 — Train ML Models

Open VSCode → navigate to `notebooks/`

1. Run `02_symptom_model.ipynb` → trains RF + SVM + SHAP
2. Run `03_temporal_lstm.ipynb` → trains LSTM temporal model

### Step 5 — Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (copy from `.env.example`):
```env
VITE_FIREBASE_API_KEY=your_value
VITE_FIREBASE_AUTH_DOMAIN=your_value
VITE_FIREBASE_PROJECT_ID=your_value
```

### Step 6 — Run

**Terminal 1 — Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open → **http://localhost:5173** 🎉

---

## 🖥 Usage

### Basic Symptom Check
1. Go to **Check** tab
2. Tap symptoms (Fever, Cough, etc.) → select severity and duration
3. Click **Check Symptoms Now**
4. See diagnosis with confidence %, SHAP explanation, urgency score, medicines

### Voice Input (Tamil/Malayalam/Hindi)
1. Select language from dropdown
2. Click **Voice** tab → Start Recording
3. Say symptoms in your language: *"எனக்கு காய்ச்சல் மற்றும் தலைவலி இருக்கிறது"*
4. Symptoms auto-detected and added

### Journey Tracker
1. Click **📅 Journey** in navbar
2. Start journey → add today's symptoms
3. Come back next day → add again
4. See severity trend chart + escalation alerts

### Family Health Vault
1. Click **👨‍👩‍👧 Family** → Create vault
2. Add family members (Appa, Amma, etc.)
3. Record symptoms for each member
4. App alerts if 2+ members share same illness

### Medicine Interaction Check
1. Click **💊 Medicines**
2. Tap medicines from chips OR upload prescription photo
3. Click **Check if Safe**
4. See interactions, timing advice, food warnings

---

## 🔑 API Keys Required

| Service | Purpose | Free? | Link |
|---------|---------|-------|------|
| **Groq** | LLaMA diagnosis + Whisper voice | ✅ Free | https://console.groq.com |
| **Firebase** | Session storage (optional) | ✅ Free tier | https://console.firebase.google.com |

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/diagnosis/analyse` | Full diagnosis pipeline |
| POST | `/api/voice/transcribe` | Voice → symptoms |
| POST | `/api/image/analyse` | Image → conditions |
| POST | `/api/journey/{id}/day` | Add journey day |
| POST | `/api/medicine-check/check` | Drug interactions |
| POST | `/api/prescription/read` | Read prescription photo |
| POST | `/api/family/create` | Create family vault |
| GET  | `/api/location/risk` | Location disease risk |

Full API docs: **http://localhost:8000/docs** (Swagger UI)

---

## 🌐 Supported Languages

| Language | Code | Voice | UI | Diagnosis |
|----------|------|-------|-----|-----------|
| English  | `en` | ✅ | ✅ | ✅ |
| Tamil    | `ta` | ✅ | ✅ | ✅ |
| Malayalam| `ml` | ✅ | ✅ | ✅ |
| Hindi    | `hi` | ✅ | ✅ | ✅ |

---

## 🔬 Research & Publication

This project is designed for publication in:
- **IEEE Access** (Impact Factor: 3.9)
- **Computers in Biology and Medicine** (Impact Factor: 7.7)
- **Expert Systems with Applications** (Impact Factor: 8.5)

### Key Innovations for Paper
1. **Hybrid RF+LSTM Temporal Pipeline** — first system to combine static ML with temporal progression for symptom analysis
2. **SHAP-based Multilingual XAI** — explainable AI in 4 Indian languages
3. **Geo-aware Diagnosis** — location + season disease risk integration
4. **Family Outbreak Detection** — household transmission pattern recognition
5. **Prescription OCR + Interaction** — end-to-end medication safety pipeline

---

## 🛠 Tech Stack

**Backend:** FastAPI · Python 3.11 · scikit-learn · TensorFlow/Keras · SHAP · Groq SDK · Firebase Admin

**Frontend:** React 18 · Vite · i18next · Axios · Space Grotesk font

**AI Models:** LLaMA 3.3 70B · Whisper Large V3 · LLaMA 4 Scout (Vision) · Random Forest · LSTM

**Data:** Kaggle Disease-Symptom Dataset · Medicine Recommendation Dataset · Medical QA Dataset

---

## 👥 Team

**Final Year Project**

| Name | Role |
|------|------|
| Kishore Kannan N(Kishorelytics) | Data Scienttist | ML Engineer |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## ⚠ Disclaimer

MediSense is an **educational and research project**. It is **NOT a substitute for professional medical advice**. Always consult a qualified doctor for medical decisions. The developers are not responsible for any health decisions made based on this application.

---

