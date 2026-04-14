from enum import IntEnum
from uuid import UUID
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field, field_validator


class AssetType(str, Enum):
    cash = "Cash"
    crypto = "Crypto"
    stocks = "Stocks"
    cpf_oa = "CPF-OA"


class VolatilityLevel(IntEnum):
    stable = 1   # Cash, CPF
    moderate = 2  # ETFs, broad-market stocks
    high = 3     # Crypto, single-stock growth tech


class Owner(str, Enum):
    user_a = "UserA"
    user_b = "UserB"
    shared = "Shared"


class AssetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: AssetType
    balance: float = Field(..., ge=0, description="Current balance in SGD")
    volatility_level: VolatilityLevel
    owner: Owner

    @field_validator("volatility_level", mode="before")
    @classmethod
    def coerce_volatility(cls, v: int) -> VolatilityLevel:
        return VolatilityLevel(v)


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[AssetType] = None
    balance: Optional[float] = Field(None, ge=0)
    volatility_level: Optional[VolatilityLevel] = None
    owner: Optional[Owner] = None


class Asset(AssetBase):
    id: UUID

    model_config = {"from_attributes": True}
