"""
Unit tests for the Risk-Aware Waterfall Engine.
Run with: pytest backend/tests/test_waterfall.py -v
No Supabase connection required.
"""

import uuid
from datetime import date, timedelta
from typing import Optional

import pytest

from app.models.asset import Asset, AssetType, Owner, VolatilityLevel
from app.models.milestone import Milestone, MilestoneCategory
from app.services.waterfall import run_waterfall


# ── Fixtures ─────────────────────────────────────────────────────────────────

def _asset(balance: float, vol: int, owner: str = "UserA") -> Asset:
    return Asset(
        id=uuid.uuid4(),
        name=f"Asset-{vol}",
        type=AssetType.cash if vol == 1 else AssetType.crypto if vol == 3 else AssetType.stocks,
        balance=balance,
        volatility_level=VolatilityLevel(vol),
        owner=Owner(owner),
    )


def _milestone(
    target: float,
    rank: int,
    months_away: float = 24,
    name: Optional[str] = None,
) -> Milestone:
    target_date = date.today() + timedelta(days=int(months_away * 30.4375))
    return Milestone(
        id=uuid.uuid4(),
        name=name or f"Milestone-{rank}",
        target_amount=target,
        target_date=target_date,
        priority_rank=rank,
        category=MilestoneCategory.other,
    )


# ── Basic allocation ──────────────────────────────────────────────────────────

def test_single_milestone_fully_funded():
    assets = [_asset(10_000, vol=1)]
    milestones = [_milestone(8_000, rank=1)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert mf.is_fully_funded
    assert mf.funded_amount == pytest.approx(8_000)
    assert mf.funding_breakdown.stable == pytest.approx(8_000)
    assert mf.funding_breakdown.high == pytest.approx(0)
    assert result.remaining_pool == pytest.approx(2_000)


def test_single_milestone_partially_funded():
    assets = [_asset(5_000, vol=1)]
    milestones = [_milestone(10_000, rank=1)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert not mf.is_fully_funded
    assert mf.funded_amount == pytest.approx(5_000)
    assert mf.funding_pct == pytest.approx(0.5)


def test_waterfall_fills_in_priority_order():
    """Pool of 15k should fill milestone #1 (10k) then partially fund #2."""
    assets = [_asset(15_000, vol=1)]
    milestones = [_milestone(10_000, rank=1), _milestone(10_000, rank=2)]

    result = run_waterfall(assets, milestones)

    m1, m2 = result.milestones
    assert m1.is_fully_funded
    assert m1.funded_amount == pytest.approx(10_000)
    assert not m2.is_fully_funded
    assert m2.funded_amount == pytest.approx(5_000)
    assert result.remaining_pool == pytest.approx(0)


def test_stable_assets_fill_before_volatile():
    """5k stable + 10k crypto; milestone needs 5k — should be funded by stable only."""
    assets = [_asset(5_000, vol=1), _asset(10_000, vol=3)]
    milestones = [_milestone(5_000, rank=1)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert mf.is_fully_funded
    assert mf.funding_breakdown.stable == pytest.approx(5_000)
    assert mf.funding_breakdown.high == pytest.approx(0)
    assert mf.volatile_pct == pytest.approx(0.0)


def test_volatile_assets_fund_when_stable_exhausted():
    """1k stable + 10k crypto; milestone needs 5k — crypto should cover the gap."""
    assets = [_asset(1_000, vol=1), _asset(10_000, vol=3)]
    milestones = [_milestone(5_000, rank=1)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert mf.is_fully_funded
    assert mf.funding_breakdown.stable == pytest.approx(1_000)
    assert mf.funding_breakdown.high == pytest.approx(4_000)
    assert mf.volatile_pct == pytest.approx(4_000 / 5_000)


# ── De-risk warning ───────────────────────────────────────────────────────────

def test_derisk_warning_triggered():
    """Near-term milestone (6 months) funded >20% by crypto → warning."""
    assets = [_asset(2_000, vol=1), _asset(8_000, vol=3)]
    milestones = [_milestone(10_000, rank=1, months_away=6)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert mf.derisk_warning is True
    assert result.any_derisk_warning is True


def test_derisk_warning_not_triggered_far_future():
    """Same funding mix but target is 24 months away → no warning."""
    assets = [_asset(2_000, vol=1), _asset(8_000, vol=3)]
    milestones = [_milestone(10_000, rank=1, months_away=24)]

    result = run_waterfall(assets, milestones)

    assert result.milestones[0].derisk_warning is False


def test_derisk_warning_not_triggered_low_volatile_pct():
    """Near-term milestone but crypto is <20% of funding → no warning."""
    assets = [_asset(9_000, vol=1), _asset(1_000, vol=3)]
    milestones = [_milestone(10_000, rank=1, months_away=6)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert mf.volatile_pct == pytest.approx(0.1)
    assert mf.derisk_warning is False


# ── Stress test ───────────────────────────────────────────────────────────────

def test_stress_test_breaks_milestone():
    """Milestone funded by 100% crypto. Under 50% haircut it should break."""
    assets = [_asset(10_000, vol=3)]
    milestones = [_milestone(10_000, rank=1, months_away=24)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert mf.is_fully_funded
    assert not mf.stress_is_fully_funded
    assert mf.stress_breaks is True
    assert mf.stress_funded_amount == pytest.approx(5_000)
    assert "Milestone-1" in result.milestones_breaking_under_stress


def test_stress_test_stable_asset_survives():
    """Milestone funded entirely by cash — no haircut, survives stress."""
    assets = [_asset(10_000, vol=1)]
    milestones = [_milestone(10_000, rank=1, months_away=24)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert mf.stress_is_fully_funded
    assert mf.stress_breaks is False
    assert result.milestones_breaking_under_stress == []


def test_stress_test_moderate_haircut():
    """Milestone funded by moderate assets gets 20% haircut."""
    assets = [_asset(10_000, vol=2)]
    milestones = [_milestone(9_000, rank=1, months_away=24)]

    result = run_waterfall(assets, milestones)

    mf = result.milestones[0]
    assert mf.is_fully_funded
    # 10k * 0.8 = 8k; milestone needs 9k → breaks
    assert not mf.stress_is_fully_funded
    assert mf.stress_breaks is True


# ── Edge cases ────────────────────────────────────────────────────────────────

def test_empty_milestones():
    assets = [_asset(10_000, vol=1)]
    result = run_waterfall(assets, [])
    assert result.milestones == []
    assert result.total_pool == pytest.approx(10_000)
    assert result.remaining_pool == pytest.approx(10_000)


def test_empty_assets():
    milestones = [_milestone(10_000, rank=1)]
    result = run_waterfall([], milestones)
    mf = result.milestones[0]
    assert not mf.is_fully_funded
    assert mf.funded_amount == pytest.approx(0)
    assert result.total_pool == pytest.approx(0)


def test_duplicate_priority_rank_raises():
    assets = [_asset(10_000, vol=1)]
    milestones = [_milestone(5_000, rank=1), _milestone(5_000, rank=1)]
    with pytest.raises(ValueError, match="Duplicate priority_rank"):
        run_waterfall(assets, milestones)


def test_milestones_returned_in_priority_order():
    """Engine must return milestones sorted by rank regardless of input order."""
    assets = [_asset(30_000, vol=1)]
    milestones = [
        _milestone(10_000, rank=3, name="C"),
        _milestone(10_000, rank=1, name="A"),
        _milestone(10_000, rank=2, name="B"),
    ]
    result = run_waterfall(assets, milestones)
    names = [mf.milestone.name for mf in result.milestones]
    assert names == ["A", "B", "C"]
