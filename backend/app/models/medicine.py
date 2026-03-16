from pydantic import BaseModel
from typing import List, Optional

class OTCMedicine(BaseModel):
    name: str
    generic_name: str
    dosage: str
    frequency: str
    warnings: List[str]
    not_for: List[str]         # e.g. ["pregnant women", "children under 5"]

class HomeRemedy(BaseModel):
    remedy: str
    instructions: str
    ingredients: List[str]
    suitable_for: str

class MedicineResponse(BaseModel):
    condition: str
    otc_medicines: List[OTCMedicine]
    home_remedies: List[HomeRemedy]
    disclaimer: str
    language: str
