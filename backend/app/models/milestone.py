from uuid import UUID
from typing import Optional
from datetime import date
from enum import Enum
from pydantic import BaseModel, Field, field_validator


class MilestoneCategory(str, Enum):
    wedding = "Wedding"
    housing = "Housing"
    travel = "Travel"
    emergency = "Emergency"
    investment = "Investment"
    other = "Other"


class MilestoneBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    target_amount: float = Field(..., gt=0, description="Target funding amount in SGD")
    target_date: date
    priority_rank: int = Field(..., ge=1, description="1 = highest priority")
    category: MilestoneCategory

    @field_validator("target_date")
    @classmethod
    def target_date_must_be_future(cls, v: date) -> date:
        if v <= date.today():
            raise ValueError("target_date must be in the future")
        return v


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount: Optional[float] = Field(None, gt=0)
    target_date: Optional[date] = None
    priority_rank: Optional[int] = Field(None, ge=1)
    category: Optional[MilestoneCategory] = None

    @field_validator("target_date")
    @classmethod
    def target_date_must_be_future(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v <= date.today():
            raise ValueError("target_date must be in the future")
        return v


class Milestone(MilestoneBase):
    id: UUID

    model_config = {"from_attributes": True}
