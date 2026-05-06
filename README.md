# fin-shark — Milestone Mission Control

A personal financial "Life OS" for tracking progress toward major life goals. Built for a Singapore-based couple to monitor savings velocity toward milestones like a wedding, BTO renovation, or emergency fund — without granular expense tracking.

---

## Features

### Risk-Aware Waterfall Allocation
Assets are logically poured into milestones in priority order (highest priority first) before moving to the next. Within each pour, stable cash fills first, then moderate assets (ETFs), then high-volatility assets (crypto). This models the sensible behaviour of someone who would naturally de-risk near-term goals.

### Dynamic Risk Engine
Two automatic risk checks run on every dashboard load:

- **De-risk Warning** — fires when a milestone's target date is less than 12 months away and more than 20% of its funding comes from high-volatility assets (crypto/growth tech). Prompts you to rebalance toward cash.
- **Stress Test** — applies a 50% haircut to high-volatility assets and a 20% haircut to moderate assets, then checks whether each milestone would still be fully funded. Milestones that break under stress are flagged.

### Asset Management
Full CRUD for your asset pool. Each asset has:
- Name, type (Cash / Crypto / Stocks / CPF-OA), and current balance
- Volatility level (1 = Stable, 2 = Moderate, 3 = High)
- Owner (UserA / UserB / Shared)

### Milestone Management
Full CRUD for your goals. Each milestone has:
- Name, target amount, target date, and priority rank
- Category (Wedding / Housing / Travel / Emergency / Investment / Other)

Priority rank determines waterfall order — rank 1 gets funded first.

### Net Worth History
Append-only snapshots of your total asset pool over time. Take a snapshot at any point with one click. The history page shows:
- Latest net worth with change vs the previous snapshot
- SVG line chart of net worth over time
- Table of all snapshots with per-row delta

### Passcode Gate
The entire app sits behind a passcode. Write operations (create, edit, delete) require the passcode to be sent with every request. Read operations are unauthenticated at the API level but unreachable without the frontend gate.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui |
| Backend | FastAPI (Python 3.12), Pydantic v2 |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (frontend), Render (backend) |

---

## Running Locally

### Prerequisites
- Node.js 20+
- Python 3.12
- A Supabase project with the schema applied (see `schema.sql`)

### 1. Apply the database schema

Open the Supabase SQL Editor and run the contents of `schema.sql`. This creates the `assets`, `milestones`, and `snapshots` tables with row-level security policies.

### 2. Configure the backend

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000
APP_PASSCODE=your-chosen-passcode
```

> Use the **service role key**, not the anon key. The backend bypasses RLS via this key.

### 3. Start the backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload
```

The API is now running at `http://localhost:8000`. You can browse the auto-generated docs at `http://localhost:8000/docs`.

### 4. Configure the frontend

```bash
cp frontend/.env.local.example frontend/.env.local
```

`frontend/.env.local` should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Enter your passcode when prompted.

---

## Deploying to the Web

### Backend — Render

1. Create a new **Web Service** on [Render](https://render.com) pointing at the `backend/` directory.
2. Set the build command to `pip install -r requirements.txt` and the start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Set the following environment variables in the Render dashboard:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `APP_PASSCODE` | Your chosen passcode |
| `ALLOWED_ORIGINS` | Your Vercel frontend URL, e.g. `https://fin-shark.vercel.app` |
| `PYTHON_VERSION` | `3.12.3` |

4. Deploy. Note the service URL (e.g. `https://fin-shark-api.onrender.com`).

### Frontend — Vercel

1. Import the repository on [Vercel](https://vercel.com). Set the **Root Directory** to `frontend`.
2. Add the environment variable:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-render-service.onrender.com/api/v1` |

3. Deploy.

---

## API Overview

All endpoints are prefixed with `/api/v1`. Write endpoints require the `x-passcode` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/assets/` | List all assets |
| `POST` | `/assets/` | Create an asset |
| `PATCH` | `/assets/{id}` | Update an asset |
| `DELETE` | `/assets/{id}` | Delete an asset |
| `GET` | `/milestones/` | List milestones (priority order) |
| `POST` | `/milestones/` | Create a milestone |
| `PATCH` | `/milestones/{id}` | Update a milestone |
| `DELETE` | `/milestones/{id}` | Delete a milestone |
| `GET` | `/waterfall/` | Run waterfall + risk engine |
| `GET` | `/snapshots/` | List snapshots (newest first) |
| `POST` | `/snapshots/` | Take a snapshot of current net worth |
| `GET` | `/health` | Health check |
