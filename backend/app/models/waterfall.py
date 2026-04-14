from __future__ import annotations

from pydantic import BaseModel, Field
from app.models.milestone import Milestone


class VolatilityBreakdown(BaseModel):
    """How much of a milestone's funding comes from each volatility tier."""
    stable: float = Field(..., description="Amount funded by level-1 (Cash/CPF) assets")
    moderate: float = Field(..., description="Amount funded by level-2 (ETF/Stocks) assets")
    high: float = Field(..., description="Amount funded by level-3 (Crypto/Growth) assets")


class MilestoneFunding(BaseModel):
    milestone: Milestone

    # Normal scenario
    funded_amount: float = Field(..., description="SGD amount allocated to this milestone")
    funding_pct: float = Field(..., description="funded_amount / target_amount (0–1+)")
    is_fully_funded: bool
    funding_breakdown: VolatilityBreakdown

    # Risk metrics
    volatile_pct: float = Field(
        ...,
        description="Fraction of funded_amount sourced from level-3 assets (0–1)",
    )
    months_to_target: float = Field(..., description="Calendar months until target_date")
    derisk_warning: bool = Field(
        ...,
        description=(
            "True when target_date < 12 months away AND "
            ">20 % of funding is from high-volatility (level-3) assets"
        ),
    )

    # Stress-test scenario (level-3 haircut 50 %, level-2 haircut 20 %)
    stress_funded_amount: float
    stress_funding_pct: float
    stress_is_fully_funded: bool
    stress_breaks: bool = Field(
        ...,
        description="True when the milestone is fully funded normally but breaks under stress",
    )


class WaterfallResult(BaseModel):
    milestones: list[MilestoneFunding]

    # Pool-level summaries
    total_pool: float = Field(..., description="Sum of all asset balances (SGD)")
    stress_pool: float = Field(..., description="Total pool after stress-test haircuts (SGD)")
    remaining_pool: float = Field(..., description="Pool left over after all milestones are filled")
    stress_remaining_pool: float

    # Convenience flags
    any_derisk_warning: bool
    milestones_breaking_under_stress: list[str] = Field(
        ..., description="Names of milestones that break in the stress scenario"
    )
