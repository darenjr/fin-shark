from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class SnapshotBase(BaseModel):
    total_net_worth: float = Field(..., ge=0, description="Total net worth in SGD at time of snapshot")


class SnapshotCreate(SnapshotBase):
    pass


class Snapshot(SnapshotBase):
    id: UUID
    timestamp: datetime

    model_config = {"from_attributes": True}
