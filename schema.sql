-- ============================================================
-- Milestone Mission Control — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation (already on by default in Supabase, but safe to include)
create extension if not exists "pgcrypto";


-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

create type asset_type as enum (
    'Cash',
    'Crypto',
    'Stocks',
    'CPF-OA'
);

create type asset_owner as enum (
    'UserA',
    'UserB',
    'Shared'
);

create type milestone_category as enum (
    'Wedding',
    'Housing',
    'Travel',
    'Emergency',
    'Investment',
    'Other'
);


-- ------------------------------------------------------------
-- ASSETS
-- volatility_level: 1 = Stable/Cash, 2 = Moderate/ETFs, 3 = High/Crypto
-- ------------------------------------------------------------

create table if not exists assets (
    id               uuid primary key default gen_random_uuid(),
    name             varchar(100)    not null,
    type             asset_type      not null,
    balance          numeric(15, 2)  not null check (balance >= 0),
    volatility_level smallint        not null check (volatility_level between 1 and 3),
    owner            asset_owner     not null,
    created_at       timestamptz     not null default now(),
    updated_at       timestamptz     not null default now()
);

-- Auto-update updated_at on every row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger assets_set_updated_at
    before update on assets
    for each row execute function set_updated_at();


-- ------------------------------------------------------------
-- MILESTONES
-- priority_rank: 1 = highest priority (waterfall order)
-- ------------------------------------------------------------

create table if not exists milestones (
    id              uuid primary key default gen_random_uuid(),
    name            varchar(100)       not null,
    target_amount   numeric(15, 2)     not null check (target_amount > 0),
    target_date     date               not null check (target_date > current_date),
    priority_rank   smallint           not null check (priority_rank >= 1),
    category        milestone_category not null,
    created_at      timestamptz        not null default now(),
    updated_at      timestamptz        not null default now()
);

-- Enforce unique priority ranks so waterfall ordering is deterministic
create unique index milestones_priority_rank_unique on milestones (priority_rank);

create trigger milestones_set_updated_at
    before update on milestones
    for each row execute function set_updated_at();


-- ------------------------------------------------------------
-- SNAPSHOTS
-- Append-only ledger of net-worth over time (no updates/deletes)
-- ------------------------------------------------------------

create table if not exists snapshots (
    id              uuid primary key default gen_random_uuid(),
    total_net_worth numeric(15, 2) not null check (total_net_worth >= 0),
    timestamp       timestamptz    not null default now()
);


-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Enable RLS — all access goes through the service-role key on
-- the backend. Uncomment the policies below only if you later
-- add Supabase Auth and want per-user enforcement.
-- ------------------------------------------------------------

alter table assets    enable row level security;
alter table milestones enable row level security;
alter table snapshots  enable row level security;

-- Allow the service role unrestricted access (backend uses this key)
create policy "service role full access" on assets
    for all using (true) with check (true);

create policy "service role full access" on milestones
    for all using (true) with check (true);

create policy "service role full access" on snapshots
    for all using (true) with check (true);
