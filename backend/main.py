import sys
import os

# Ensure backend and ai-service paths are in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
ai_dir = os.path.abspath(os.path.join(current_dir, "..", "ai-service"))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if ai_dir not in sys.path:
    sys.path.insert(0, ai_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import routers.auth_router as auth_router
import routers.trees_router as trees_router
import routers.verification_router as verification_router
import routers.survival_router as survival_router
import routers.rewards_router as rewards_router
import routers.campaigns_router as campaigns_router
import routers.leaderboard_router as leaderboard_router
import routers.admin_router as admin_router
import routers.notifications_router as notifications_router
from seed import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GreenProof Environmental API",
    description="AI-Powered Tree Plantation Verification, Survival Monitoring & Environmental Rewards Ledger",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(auth_router.router)
app.include_router(trees_router.router)
app.include_router(verification_router.router)
app.include_router(survival_router.router)
app.include_router(rewards_router.router)
app.include_router(campaigns_router.router)
app.include_router(leaderboard_router.router)
app.include_router(admin_router.router)
app.include_router(notifications_router.router)

@app.on_event("startup")
def on_startup():
    print("Starting GreenProof FastAPI Backend...")
    try:
        seed_database()
    except Exception as e:
        print(f"Seed note: {e}")

@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "GreenProof AI Environmental Backend",
        "version": "1.0.0",
        "database": "CONNECTED",
        "ai_engine": "ACTIVE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
