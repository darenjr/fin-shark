from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.models import Asset, AssetCreate, AssetUpdate
from app.supabase_client import get_supabase
from app.auth import verify_passcode

router = APIRouter(prefix="/assets", tags=["assets"])

TABLE = "assets"


def _row_to_asset(row: dict) -> Asset:
    return Asset.model_validate(row)


@router.get("/", response_model=List[Asset])
def list_assets(db: Client = Depends(get_supabase)):
    response = db.table(TABLE).select("*").order("name").execute()
    return [_row_to_asset(r) for r in response.data]


@router.post("/", response_model=Asset, status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreate, db: Client = Depends(get_supabase), _: None = Depends(verify_passcode)):
    data = payload.model_dump()
    # Supabase expects the enum string values, not Python enum objects
    data["type"] = data["type"].value if hasattr(data["type"], "value") else data["type"]
    data["owner"] = data["owner"].value if hasattr(data["owner"], "value") else data["owner"]
    data["volatility_level"] = int(data["volatility_level"])

    response = db.table(TABLE).insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return _row_to_asset(response.data[0])


@router.get("/{asset_id}", response_model=Asset)
def get_asset(asset_id: UUID, db: Client = Depends(get_supabase)):
    response = db.table(TABLE).select("*").eq("id", str(asset_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return _row_to_asset(response.data[0])


@router.patch("/{asset_id}", response_model=Asset)
def update_asset(asset_id: UUID, payload: AssetUpdate, db: Client = Depends(get_supabase), _: None = Depends(verify_passcode)):
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=422, detail="No fields provided to update")

    if "type" in data:
        data["type"] = data["type"].value if hasattr(data["type"], "value") else data["type"]
    if "owner" in data:
        data["owner"] = data["owner"].value if hasattr(data["owner"], "value") else data["owner"]
    if "volatility_level" in data:
        data["volatility_level"] = int(data["volatility_level"])

    response = db.table(TABLE).update(data).eq("id", str(asset_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return _row_to_asset(response.data[0])


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: UUID, db: Client = Depends(get_supabase), _: None = Depends(verify_passcode)):
    response = db.table(TABLE).delete().eq("id", str(asset_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Asset not found")
