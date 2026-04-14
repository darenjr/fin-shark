from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.models import Milestone, MilestoneCreate, MilestoneUpdate
from app.supabase_client import get_supabase
from app.auth import verify_passcode

router = APIRouter(prefix="/milestones", tags=["milestones"])

TABLE = "milestones"


def _row_to_milestone(row: dict) -> Milestone:
    return Milestone.model_validate(row)


@router.get("/", response_model=List[Milestone])
def list_milestones(db: Client = Depends(get_supabase)):
    # Always return in waterfall order so callers don't need to sort
    response = db.table(TABLE).select("*").order("priority_rank").execute()
    return [_row_to_milestone(r) for r in response.data]


@router.post("/", response_model=Milestone, status_code=status.HTTP_201_CREATED)
def create_milestone(payload: MilestoneCreate, db: Client = Depends(get_supabase), _: None = Depends(verify_passcode)):
    data = payload.model_dump()
    data["category"] = data["category"].value if hasattr(data["category"], "value") else data["category"]
    data["target_date"] = data["target_date"].isoformat()

    response = db.table(TABLE).insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return _row_to_milestone(response.data[0])


@router.get("/{milestone_id}", response_model=Milestone)
def get_milestone(milestone_id: UUID, db: Client = Depends(get_supabase)):
    response = db.table(TABLE).select("*").eq("id", str(milestone_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return _row_to_milestone(response.data[0])


@router.patch("/{milestone_id}", response_model=Milestone)
def update_milestone(milestone_id: UUID, payload: MilestoneUpdate, db: Client = Depends(get_supabase), _: None = Depends(verify_passcode)):
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=422, detail="No fields provided to update")

    if "category" in data:
        data["category"] = data["category"].value if hasattr(data["category"], "value") else data["category"]
    if "target_date" in data:
        data["target_date"] = data["target_date"].isoformat()

    response = db.table(TABLE).update(data).eq("id", str(milestone_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return _row_to_milestone(response.data[0])


@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(milestone_id: UUID, db: Client = Depends(get_supabase), _: None = Depends(verify_passcode)):
    response = db.table(TABLE).delete().eq("id", str(milestone_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Milestone not found")
