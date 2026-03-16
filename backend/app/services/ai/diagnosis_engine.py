"""
MediSense Diagnosis Engine
Uses trained RF model + LSTM temporal model as PRIMARY diagnosis.
Groq LLaMA used only for plain language explanation.
"""
import numpy as np
import json
import pickle
from pathlib import Path
from typing import List, Dict

MODEL_DIR = Path(__file__).parent.parent.parent.parent / "data" / "models"

# ── Lazy-load models (loaded once on first use) ───────────
_rf_model    = None
_svm_model   = None
_le          = None
_symptoms    = None
_lstm_model  = None
_lstm_le     = None
_lstm_config = None

def _load_rf():
    global _rf_model, _le, _symptoms
    if _rf_model is None:
        try:
            with open(MODEL_DIR / "rf_model.pkl", "rb") as f:
                _rf_model = pickle.load(f)
            with open(MODEL_DIR / "label_encoder.pkl", "rb") as f:
                _le = pickle.load(f)
            with open(MODEL_DIR / "symptoms_list.json") as f:
                _symptoms = json.load(f)
            print("✓ Random Forest model loaded")
        except FileNotFoundError:
            print("⚠ RF model not found — run notebook 02 first")
    return _rf_model, _le, _symptoms

def _load_lstm():
    global _lstm_model, _lstm_le, _lstm_config
    if _lstm_model is None:
        try:
            import tensorflow as tf
            _lstm_model = tf.keras.models.load_model(MODEL_DIR / "lstm_model.keras")
            with open(MODEL_DIR / "lstm_label_encoder.pkl", "rb") as f:
                _lstm_le = pickle.load(f)
            with open(MODEL_DIR / "lstm_config.json") as f:
                _lstm_config = json.load(f)
            print("✓ LSTM model loaded")
        except Exception as e:
            print(f"⚠ LSTM model not found — run notebook 03 first: {e}")
    return _lstm_model, _lstm_le, _lstm_config


def predict_rf(symptom_list: List[str], top_n: int = 3) -> List[Dict]:
    """
    Random Forest prediction from symptom list.
    Returns top_n diseases with confidence scores.
    """
    rf, le, symptoms = _load_rf()
    if rf is None:
        return []

    vec = np.zeros(len(symptoms))
    for s in symptom_list:
        s_norm = s.lower().strip().replace(" ", "_")
        if s_norm in symptoms:
            vec[symptoms.index(s_norm)] = 1
        elif s.lower() in symptoms:
            vec[symptoms.index(s.lower())] = 1

    proba = rf.predict_proba([vec])[0]
    top_idx = np.argsort(proba)[::-1][:top_n]

    return [
        {"disease": le.classes_[i], "confidence": float(proba[i])}
        for i in top_idx
        if proba[i] > 0.01
    ]


def predict_lstm(day_symptoms: List[List[str]], top_n: int = 3) -> List[Dict]:
    """
    LSTM temporal prediction from day-by-day symptom lists.
    day_symptoms: [['fever','headache'], ['cough'], ...]
    """
    lstm, le, config = _load_lstm()
    if lstm is None:
        return []

    max_days   = config["max_days"]
    n_symptoms = config["n_symptoms"]
    symptoms   = _symptoms or []

    seq = np.zeros((max_days, n_symptoms))
    for day_idx, syms in enumerate(day_symptoms[:max_days]):
        for s in syms:
            s_norm = s.lower().strip().replace(" ", "_")
            if s_norm in symptoms:
                seq[day_idx][symptoms.index(s_norm)] = 1.0
            elif s.lower() in symptoms:
                seq[day_idx][symptoms.index(s.lower())] = 1.0

    proba = lstm.predict(seq[np.newaxis], verbose=0)[0]
    top_idx = np.argsort(proba)[::-1][:top_n]

    return [
        {"disease": le.classes_[i], "confidence": float(proba[i])}
        for i in top_idx
        if proba[i] > 0.01
    ]


def compute_shap_weights(symptom_list: List[str]) -> List[Dict]:
    """
    Compute SHAP-based feature importance for given symptoms.
    Returns weight per symptom (0-1 scale).
    """
    rf, le, symptoms = _load_rf()
    if rf is None:
        # Fallback: equal weights
        return [{"symptom": s, "weight": 0.5} for s in symptom_list]

    try:
        import shap
        explainer = shap.TreeExplainer(rf)

        vec = np.zeros(len(symptoms))
        for s in symptom_list:
            s_norm = s.lower().strip().replace(" ", "_")
            if s_norm in symptoms:
                vec[symptoms.index(s_norm)] = 1

        shap_vals = explainer.shap_values([vec])  # shape: (n_classes, 1, n_features)
        # Average absolute SHAP across all classes
        avg_shap = np.mean(np.abs(shap_vals), axis=0)[0]

        result = []
        for s in symptom_list:
            s_norm = s.lower().strip().replace(" ", "_")
            if s_norm in symptoms:
                idx = symptoms.index(s_norm)
                weight = float(avg_shap[idx])
            else:
                weight = 0.3
            result.append({"symptom": s, "weight": min(weight * 5, 1.0)})  # scale to 0-1

        # Normalize so max = 1.0
        max_w = max((r["weight"] for r in result), default=1.0)
        if max_w > 0:
            for r in result:
                r["weight"] = round(r["weight"] / max_w, 3)

        return result

    except Exception as e:
        print(f"SHAP error: {e}")
        # Fallback weights based on symptom severity data
        severity_weights = {
            "chest_pain": 0.9, "breathlessness": 0.85, "high_fever": 0.8,
            "blood_in_sputum": 0.8, "sweating": 0.7, "vomiting": 0.65,
            "skin_rash": 0.6, "headache": 0.5, "fatigue": 0.45, "cough": 0.4,
        }
        return [
            {"symptom": s, "weight": severity_weights.get(s.lower().replace(" ", "_"), 0.3)}
            for s in symptom_list
        ]


def hybrid_predict(symptom_list: List[str], day_history: List[List[str]] = None, top_n: int = 3) -> List[Dict]:
    """
    HYBRID prediction combining RF + LSTM.
    - If day_history provided (multi-day): combine RF(40%) + LSTM(60%)
    - If single day: RF only
    Returns merged top_n predictions with confidence.
    """
    rf_preds = predict_rf(symptom_list, top_n=top_n * 2)

    if not rf_preds:
        return []

    if day_history and len(day_history) > 1:
        lstm_preds = predict_lstm(day_history, top_n=top_n * 2)

        # Merge scores: RF 40% + LSTM 60% (temporal is more accurate for progression)
        scores = {}
        for p in rf_preds:
            scores[p["disease"]] = scores.get(p["disease"], 0) + p["confidence"] * 0.4
        for p in lstm_preds:
            scores[p["disease"]] = scores.get(p["disease"], 0) + p["confidence"] * 0.6

        merged = [{"disease": d, "confidence": c} for d, c in scores.items()]
        merged.sort(key=lambda x: x["confidence"], reverse=True)
        return merged[:top_n]
    else:
        return rf_preds[:top_n]