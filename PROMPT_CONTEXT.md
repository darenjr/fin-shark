# Project Brief: Milestone Mission Control (MVP)

## 1. Objective
A personal financial "Life OS" designed for a Singapore-based couple to track progress toward major life milestones (Engagement, Wedding, BTO, etc.). The app moves away from granular expense tracking and focuses on **Goal Funding Velocity** and **Risk-Adjusted Progress**.

## 2. Core Principles
* **Encouragement over Accounting:** Use "time-to-goal" and "milestone funding %" as primary metrics.
* **Waterfall Allocation:** Assets are logically poured into milestones based on a strict priority rank.
* **Dynamic Risk Engine:** High-priority, near-term goals must be "Safe." The app warns the user if volatile assets (Crypto/Growth Tech) are the primary funders of imminent goals.
* **Budget:** $0 monthly operating cost.

## 3. Tech Stack (The "Zero-Dollar" Stack)
* **Frontend:** Next.js (App Router), Tailwind CSS, Lucide Icons, Shadcn UI (for clean components).
* **Backend:** FastAPI (Python) - handles the Waterfall & Risk logic.
* **Database & Auth:** Supabase (PostgreSQL).
* **Hosting:** Vercel (Frontend), Render or Railway (Backend).

## 4. Data Schema (PostgreSQL / Supabase)

### `assets`
* `id`: uuid (PK)
* `name`: string (e.g., "DBS Multiplier", "OKX BTC", "IBKR CSPX")
* `type`: string (Cash, Crypto, Stocks, CPF-OA)
* `balance`: numeric
* `volatility_level`: integer (1: Stable/Cash, 2: Moderate/ETFs, 3: High/Crypto)
* `owner`: string (UserA, UserB, or Shared)

### `milestones`
* `id`: uuid (PK)
* `name`: string (e.g., "BTO Renovation")
* `target_amount`: numeric
* `target_date`: date
* `priority_rank`: integer (1 = Highest)
* `category`: string (Wedding, Housing, Travel)

### `snapshots`
* `id`: uuid (PK)
* `total_net_worth`: numeric
* `timestamp`: timestamp (default: now)

## 5. Advanced Logic: Risk-Aware Waterfall

### The Allocation Algorithm:
1.  **Sort** milestones by `priority_rank`.
2.  **Aggregate** all assets into a single "Liquid Pool."
3.  **Distribute** funds to Milestone #1 until `target_amount` is reached, then move to #2, etc.
4.  **Tagging:** For each milestone, track the *weighted volatility* of the assets funding it.

### The Risk Engine Rules:
* **The "Safety Alert":** If a milestone's `target_date` is less than **12 months** away and >20% of its funding comes from `volatility_level: 3` (Crypto/Tech), trigger a **"De-risk Warning"**.
* **Stress Test Calculation:** Calculate a "Worst Case" view where Level 3 assets are haircut by 50% and Level 2 by 20%. Show the user which milestones would "break" in this scenario.

## 6. User Roles
* **Admin (Owner):** Full CRUD on assets, milestones, and risk settings.
* **Collaborator (Partner):** Read-only dashboard access with the ability to "Upvote/Comment" on milestone priority (can be handled via a simple `comments` table later).