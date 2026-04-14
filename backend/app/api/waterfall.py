from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.models.asset import Asset
from app.models.milestone import Milestone
from app.models.waterfall import WaterfallResult
from app.services.waterfall import run_waterfall
from app.supabase_client import get_supabase

router = APIRouter(prefix="/waterfall", tags=["waterfall"])


@router.get("/", response_model=WaterfallResult)
def get_waterfall(db: Client = Depends(get_supabase)):
    """
    Run the Risk-Aware Waterfall across all assets and milestones.

    Returns allocation, risk flags, and stress-test results for every
    milestone in priority order.
    """
    assets_resp = db.table("assets").select("*").execute()
    milestones_resp = db.table("milestones").select("*").order("priority_rank").execute()

    assets = [Asset.model_validate(r) for r in assets_resp.data]
    milestones = [Milestone.model_validate(r) for r in milestones_resp.data]

    try:
        result = run_waterfall(assets, milestones)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return result
