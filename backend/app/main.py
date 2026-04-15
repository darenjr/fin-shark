from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api import assets, milestones, snapshots, waterfall

app = FastAPI(title="Milestone Mission Control API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router, prefix="/api/v1")
app.include_router(milestones.router, prefix="/api/v1")
app.include_router(snapshots.router, prefix="/api/v1")
app.include_router(waterfall.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
