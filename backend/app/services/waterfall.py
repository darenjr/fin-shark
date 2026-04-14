"""
Risk-Aware Waterfall Engine
===========================
Pure business logic — no I/O, no FastAPI, no Supabase.
All inputs and outputs are plain Python / Pydantic objects.

Allocation strategy
-------------------
Assets are sorted stable-first (level 1 → 2 → 3) before being poured
into milestones. This models the sensible behaviour of a user who would
naturally de-risk near-term goals: stable cash fills high-priority
milestones first; volatile assets only fund lower-priority ones once
the stable pool is exhausted.

Risk rules (from PROMPT_CONTEXT)
---------------------------------
• De-risk Warning  : target_date < 12 months away AND
                     level-3 assets fund > 20 % of the milestone.
• Stress Test      : level-3 assets haircut 50 %, level-2 haircut 20 %.
                     A milestone "breaks" when it was fully funded
                     normally but is no longer fully funded under stress.
"""

from __future__ import annotations

from datetime import date

from app.models.asset import Asset, VolatilityLevel
from app.models.milestone import Milestone
from app.models.waterfall import MilestoneFunding, VolatilityBreakdown, WaterfallResult

# ── Constants ────────────────────────────────────────────────────────────────

_DERISK_WINDOW_MONTHS: float = 12.0
_DERISK_VOLATILE_THRESHOLD: float = 0.20  # 20 % of funded amount

_STRESS_HAIRCUT: dict[int, float] = {
    VolatilityLevel.stable: 0.00,    # Cash / CPF — no haircut
    VolatilityLevel.moderate: 0.20,  # ETFs / broad stocks
    VolatilityLevel.high: 0.50,      # Crypto / growth tech
}

_DAYS_PER_MONTH: float = 30.4375  # average, accounting for leap years


# ── Helpers ──────────────────────────────────────────────────────────────────

def _pool_by_level(assets: list[Asset]) -> dict[int, float]:
    """Sum asset balances grouped by volatility level."""
    totals: dict[int, float] = {1: 0.0, 2: 0.0, 3: 0.0}
    for asset in assets:
        totals[int(asset.volatility_level)] += asset.balance
    return totals


def _apply_stress(pool: dict[int, float]) -> dict[int, float]:
    """Return a new pool dict with stress-test haircuts applied."""
    return {
        level: balance * (1.0 - _STRESS_HAIRCUT[VolatilityLevel(level)])
        for level, balance in pool.items()
    }


def _fill_milestone(
    target: float,
    remaining: dict[int, float],
) -> tuple[dict[int, float], dict[int, float]]:
    """
    Greedily fill `target` SGD from `remaining` (mutated in-place),
    drawing from level 1 → 2 → 3 (stable first).

    Returns:
        funding_breakdown  – {level: amount_taken}
        remaining          – the same dict, now reduced
    """
    breakdown: dict[int, float] = {1: 0.0, 2: 0.0, 3: 0.0}
    still_needed = target

    for level in (1, 2, 3):
        if still_needed <= 0:
            break
        take = min(remaining[level], still_needed)
        breakdown[level] = take
        remaining[level] -= take
        still_needed -= take

    return breakdown, remaining


def _months_until(target_date: date) -> float:
    delta_days = (target_date - date.today()).days
    return delta_days / _DAYS_PER_MONTH


# ── Public API ────────────────────────────────────────────────────────────────

def run_waterfall(assets: list[Asset], milestones: list[Milestone]) -> WaterfallResult:
    """
    Execute the Risk-Aware Waterfall and return a fully annotated result.

    Raises:
        ValueError: if `milestones` contains duplicate priority_rank values
                    (should be enforced by the DB unique index, but we guard
                    here too so the engine is safe to unit-test in isolation).
    """
    if not milestones:
        return WaterfallResult(
            milestones=[],
            total_pool=sum(a.balance for a in assets),
            stress_pool=sum(
                a.balance * (1.0 - _STRESS_HAIRCUT[int(a.volatility_level)])
                for a in assets
            ),
            remaining_pool=sum(a.balance for a in assets),
            stress_remaining_pool=sum(
                a.balance * (1.0 - _STRESS_HAIRCUT[int(a.volatility_level)])
                for a in assets
            ),
            any_derisk_warning=False,
            milestones_breaking_under_stress=[],
        )

    # ── Validate priority uniqueness ─────────────────────────────────────────
    ranks = [m.priority_rank for m in milestones]
    if len(ranks) != len(set(ranks)):
        raise ValueError("Duplicate priority_rank values detected — waterfall order is ambiguous.")

    # ── Build pools ──────────────────────────────────────────────────────────
    normal_pool = _pool_by_level(assets)
    stress_pool = _apply_stress(normal_pool)

    total_pool = sum(normal_pool.values())
    total_stress_pool = sum(stress_pool.values())

    # Mutable copies consumed during waterfall pass
    normal_remaining: dict[int, float] = dict(normal_pool)
    stress_remaining: dict[int, float] = dict(stress_pool)

    # ── Waterfall pass ───────────────────────────────────────────────────────
    sorted_milestones = sorted(milestones, key=lambda m: m.priority_rank)
    funded_milestones: list[MilestoneFunding] = []

    for milestone in sorted_milestones:
        target = milestone.target_amount
        months = _months_until(milestone.target_date)

        # Normal scenario
        normal_breakdown, normal_remaining = _fill_milestone(target, normal_remaining)
        normal_funded = sum(normal_breakdown.values())
        normal_fully_funded = normal_funded >= target - 1e-9  # float tolerance

        # Stress scenario
        stress_breakdown, stress_remaining = _fill_milestone(target, stress_remaining)
        stress_funded = sum(stress_breakdown.values())
        stress_fully_funded = stress_funded >= target - 1e-9

        # Risk metrics
        volatile_amount = normal_breakdown[3]
        volatile_pct = volatile_amount / normal_funded if normal_funded > 0 else 0.0

        derisk_warning = (
            months < _DERISK_WINDOW_MONTHS
            and volatile_pct > _DERISK_VOLATILE_THRESHOLD
        )

        stress_breaks = normal_fully_funded and not stress_fully_funded

        funded_milestones.append(
            MilestoneFunding(
                milestone=milestone,
                funded_amount=round(normal_funded, 2),
                funding_pct=round(normal_funded / target, 6),
                is_fully_funded=normal_fully_funded,
                funding_breakdown=VolatilityBreakdown(
                    stable=round(normal_breakdown[1], 2),
                    moderate=round(normal_breakdown[2], 2),
                    high=round(normal_breakdown[3], 2),
                ),
                volatile_pct=round(volatile_pct, 6),
                months_to_target=round(months, 2),
                derisk_warning=derisk_warning,
                stress_funded_amount=round(stress_funded, 2),
                stress_funding_pct=round(stress_funded / target, 6),
                stress_is_fully_funded=stress_fully_funded,
                stress_breaks=stress_breaks,
            )
        )

    # ── Aggregate result ─────────────────────────────────────────────────────
    breaking = [mf.milestone.name for mf in funded_milestones if mf.stress_breaks]

    return WaterfallResult(
        milestones=funded_milestones,
        total_pool=round(total_pool, 2),
        stress_pool=round(total_stress_pool, 2),
        remaining_pool=round(sum(normal_remaining.values()), 2),
        stress_remaining_pool=round(sum(stress_remaining.values()), 2),
        any_derisk_warning=any(mf.derisk_warning for mf in funded_milestones),
        milestones_breaking_under_stress=breaking,
    )
