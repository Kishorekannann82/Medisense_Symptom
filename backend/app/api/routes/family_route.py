from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.family_service import (
    create_vault, get_vault, add_member,
    add_member_symptoms, get_family_summary
)

router = APIRouter()

class CreateVaultRequest(BaseModel):
    family_name: str

class AddMemberRequest(BaseModel):
    name:     str
    age:      int
    gender:   str
    relation: str

class AddSymptomsRequest(BaseModel):
    symptoms:  List[dict]
    diagnosis: Optional[str] = ""

@router.post("/create")
async def create_family_vault(req: CreateVaultRequest):
    vault = create_vault(req.family_name)
    return {"vault_id": vault["vault_id"], "message": "Created"}

@router.post("/{vault_id}/member")
async def add_family_member(vault_id: str, req: AddMemberRequest):
    vault = add_member(vault_id, req.name, req.age, req.gender, req.relation)
    return {"message": f"Added {req.name}", "members": vault["members"]}

@router.post("/{vault_id}/member/{member_id}/symptoms")
async def record_member_symptoms(vault_id: str, member_id: str, req: AddSymptomsRequest):
    vault   = add_member_symptoms(vault_id, member_id, req.symptoms, req.diagnosis or "")
    summary = get_family_summary(vault)
    return {
        "message": "Saved",
        "alerts":  vault.get("alerts", []),
        "summary": summary
    }

@router.get("/{vault_id}/full")
async def get_full_vault(vault_id: str):
    vault = get_vault(vault_id)
    if not vault:
        return {"error": "Not found"}
    return vault

@router.get("/{vault_id}")
async def get_family_vault(vault_id: str):
    vault = get_vault(vault_id)
    if not vault:
        return {"error": "Vault not found"}
    return get_family_summary(vault)