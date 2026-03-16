"""
MediSense Data Preprocessor
Run from backend/data/ folder:
  python preprocess.py
"""
import pandas as pd
import json
from pathlib import Path

# ── Paths (relative to backend/data/) ────────────────────
HERE         = Path(__file__).parent
RAW_SYMPTOM  = HERE.parent.parent / "data" / "symptom_disease"
RAW_MEDICINE = HERE.parent.parent / "data" / "medicine"
OUT          = HERE / "processed"
OUT.mkdir(parents=True, exist_ok=True)

GREEN = "\033[92m"; YELLOW = "\033[93m"; RED = "\033[91m"; RESET = "\033[0m"
def ok(m):   print(f"{GREEN}  ✓ {m}{RESET}")
def info(m): print(f"{YELLOW}  → {m}{RESET}")
def err(m):  print(f"{RED}  ✗ {m}{RESET}")


# ══════════════════════════════════════════════════════════
# 1. Disease → Symptoms mapping
# ══════════════════════════════════════════════════════════
def process_symptoms():
    info("Processing disease-symptom dataset...")

    # Try Training.csv first (bigger), then dataset.csv
    csv_path = RAW_SYMPTOM / "Training.csv"
    if not csv_path.exists():
        csv_path = RAW_SYMPTOM / "dataset.csv"
    if not csv_path.exists():
        err("No symptom CSV found. Run download_datasets.py first."); return

    df = pd.read_csv(csv_path)
    ok(f"Loaded {csv_path.name} — {len(df)} rows, {len(df.columns)} columns")

    # Find symptom columns (all except Disease/prognosis)
    disease_col = None
    for col in df.columns:
        if col.lower() in ('disease', 'prognosis'):
            disease_col = col
            break

    if disease_col is None:
        err("Could not find Disease column"); return

    symptom_cols = [c for c in df.columns if c != disease_col]

    disease_map = {}
    for _, row in df.iterrows():
        disease = str(row[disease_col]).strip()
        if disease in ('nan', '', 'Disease'):
            continue
        symptoms = []
        for c in symptom_cols:
            val = str(row[c]).strip()
            if val not in ('nan', '', 'NaN', 'None'):
                symptoms.append(val.strip())
        if disease not in disease_map:
            disease_map[disease] = set()
        disease_map[disease].update(symptoms)

    output = {d: sorted(list(s)) for d, s in disease_map.items() if s}

    with open(OUT / "disease_symptoms.json", "w") as f:
        json.dump(output, f, indent=2)
    ok(f"disease_symptoms.json — {len(output)} diseases")

    # All unique symptoms
    all_symptoms = sorted(set(s for syms in output.values() for s in syms))
    with open(OUT / "all_symptoms.json", "w") as f:
        json.dump(all_symptoms, f, indent=2)
    ok(f"all_symptoms.json — {len(all_symptoms)} unique symptoms")

    return output, all_symptoms


# ══════════════════════════════════════════════════════════
# 2. Symptom Severity weights
# ══════════════════════════════════════════════════════════
def process_severity():
    info("Processing symptom severity...")

    # Try both filenames
    for fname in ["Symptom-severity.csv", "symptom_severity.csv"]:
        path = RAW_SYMPTOM / fname
        if not path.exists():
            path = RAW_MEDICINE / fname
        if path.exists():
            df = pd.read_csv(path)
            severity = {}
            for _, row in df.iterrows():
                sym = str(row.iloc[0]).strip()
                try:
                    weight = int(row.iloc[1])
                except:
                    weight = 3
                if sym not in ('nan', ''):
                    severity[sym] = weight
            with open(OUT / "symptom_severity.json", "w") as f:
                json.dump(severity, f, indent=2)
            ok(f"symptom_severity.json — {len(severity)} symptoms from {fname}")
            return

    err("Symptom severity CSV not found, skipping")


# ══════════════════════════════════════════════════════════
# 3. Precautions
# ══════════════════════════════════════════════════════════
def process_precautions():
    info("Processing precautions...")

    for fname in ["precautions_df.csv", "symptom_precaution.csv"]:
        path = RAW_SYMPTOM / fname
        if not path.exists():
            path = RAW_MEDICINE / fname
        if path.exists():
            df = pd.read_csv(path)
            prec = {}
            for _, row in df.iterrows():
                disease = str(row.iloc[0]).strip()
                if disease in ('nan', ''):
                    continue
                precautions = [
                    str(row.iloc[i]).strip()
                    for i in range(1, min(5, len(row)))
                    if str(row.iloc[i]).strip() not in ('nan', '', 'NaN')
                ]
                prec[disease] = precautions
            with open(OUT / "precautions.json", "w") as f:
                json.dump(prec, f, indent=2)
            ok(f"precautions.json — {len(prec)} diseases from {fname}")
            return

    err("Precautions CSV not found, skipping")


# ══════════════════════════════════════════════════════════
# 4. Medicines / Medications
# ══════════════════════════════════════════════════════════
def process_medicines():
    info("Processing medicines...")

    for fname in ["medications.csv", "medicine_recommendation.csv"]:
        path = RAW_MEDICINE / fname
        if path.exists():
            df = pd.read_csv(path)
            ok(f"Loaded {fname} — {len(df)} rows")
            # Save as JSON too
            medicines = {}
            for _, row in df.iterrows():
                disease = str(row.iloc[0]).strip()
                if disease in ('nan', ''):
                    continue
                meds = [
                    str(row.iloc[i]).strip()
                    for i in range(1, len(row))
                    if str(row.iloc[i]).strip() not in ('nan', '', 'NaN')
                ]
                medicines[disease] = meds
            with open(OUT / "medicines.json", "w") as f:
                json.dump(medicines, f, indent=2)
            ok(f"medicines.json — {len(medicines)} diseases")
            return

    err("Medications CSV not found, skipping")


# ══════════════════════════════════════════════════════════
# 5. Diets
# ══════════════════════════════════════════════════════════
def process_diets():
    info("Processing diets...")
    path = RAW_MEDICINE / "diets.csv"
    if path.exists():
        df = pd.read_csv(path)
        diets = {}
        for _, row in df.iterrows():
            disease = str(row.iloc[0]).strip()
            if disease in ('nan', ''):
                continue
            diet_items = [
                str(row.iloc[i]).strip()
                for i in range(1, len(row))
                if str(row.iloc[i]).strip() not in ('nan', '', 'NaN')
            ]
            diets[disease] = diet_items
        with open(OUT / "diets.json", "w") as f:
            json.dump(diets, f, indent=2)
        ok(f"diets.json — {len(diets)} diseases")
    else:
        err("diets.csv not found, skipping")


# ══════════════════════════════════════════════════════════
# 6. Description
# ══════════════════════════════════════════════════════════
def process_descriptions():
    info("Processing disease descriptions...")

    for fname in ["symptom_description.csv", "description.csv"]:
        path = RAW_SYMPTOM / fname
        if not path.exists():
            path = RAW_MEDICINE / fname
        if path.exists():
            df = pd.read_csv(path)
            desc = {}
            for _, row in df.iterrows():
                disease = str(row.iloc[0]).strip()
                description = str(row.iloc[1]).strip() if len(row) > 1 else ""
                if disease not in ('nan', '') and description not in ('nan', ''):
                    desc[disease] = description
            with open(OUT / "descriptions.json", "w") as f:
                json.dump(desc, f, indent=2)
            ok(f"descriptions.json — {len(desc)} diseases from {fname}")
            return

    err("Description CSV not found, skipping")


# ══════════════════════════════════════════════════════════
# Run all
# ══════════════════════════════════════════════════════════
if __name__ == "__main__":
    print(f"\n{YELLOW}╔══════════════════════════════════════╗")
    print(f"║   MediSense Data Preprocessor        ║")
    print(f"╚══════════════════════════════════════╝{RESET}\n")

    process_symptoms()
    process_severity()
    process_precautions()
    process_medicines()
    process_diets()
    process_descriptions()

    # Show what was created
    print(f"\n{GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"  Files saved in backend/data/processed/")
    for f in sorted(OUT.glob("*.json")):
        print(f"  📄 {f.name}  ({f.stat().st_size // 1024} KB)")
    print(f"\n  Next: open notebooks/02_symptom_model.ipynb")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")