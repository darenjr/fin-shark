from typing import List
from fastapi import APIRouter, Depends, status
from supabase import Client

from app.models.snapshot import Snapshot
from app.supabase_client import get_supabase
from app.auth import verify_passcode

router = APIRouter(prefix="/snapshots", tags=["snapshots"])

TABLE = "snapshots"
ASSETS_TABLE = "assets"


@router.get("/", response_model=List[Snapshot])
def list_snapshots(limit: int = 90, db: Client = Depends(get_supabase)):
    """Return up to `limit` snapshots, newest first."""
    response = (
        db.table(TABLE)
        .select("*")
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )
    return [Snapshot.model_validate(r) for r in response.data]


@router.post("/", response_model=Snapshot, status_code=status.HTTP_201_CREATED)
def create_snapshot(db: Client = Depends(get_supabase), _: None = Depends(verify_passcode)):
    """
    Compute the current total net worth from the assets table and
    append a new snapshot record.  The caller does not need to supply
    any body — the backend is the source of truth.
    """
    assets_resp = db.table(ASSETS_TABLE).select("balance").execute()
    total = sum(float(row["balance"]) for row in assets_resp.data)

    insert_resp = db.table(TABLE).insert({"total_net_worth": total}).execute()
    return Snapshot.model_validate(insert_resp.data[0])
