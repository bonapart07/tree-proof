import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-service")))
from vision_engine import ai_vision_engine

import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api/survival", tags=["Survival Monitoring"])

@router.post("/check", response_model=schemas.SurvivalCheckResponse)
def submit_survival_check(
    req: schemas.SurvivalCheckRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    tree = db.query(models.Tree).filter(models.Tree.id == req.tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")

    # Run AI temporal differential comparison
    result = ai_vision_engine.compare_temporal_survival(milestone_day=req.milestone_day)

    # Update Tree status and health score
    tree.days_alive = max(tree.days_alive, req.milestone_day)
    tree.health_score = result["health_score"]
    tree.health_status = "Healthy" if result["health_score"] >= 70 else "Needs Attention"
    tree.last_verified_at = datetime.datetime.utcnow()
    tree.height_cm += (result["growth_estimate_pct"] * 0.4)

    # 1. Log verification
    verif = models.Verification(
        tree_id=tree.id,
        verification_type=f"{req.milestone_day}d",
        confidence=result["same_tree_probability"],
        verification_score=result["health_score"],
        status="verified"
    )
    db.add(verif)

    # 2. Log health assessment
    assessment = models.HealthAssessment(
        tree_id=tree.id,
        health_score=result["health_score"],
        leaf_condition=result["leaf_condition"],
        canopy_growth_pct=result["growth_estimate_pct"],
        damage_detected=False,
        ai_notes=f"Milestone Day {req.milestone_day} verified with {int(result['same_tree_probability']*100)}% same-tree structural match."
    )
    db.add(assessment)

    # 3. Issue Milestone Rewards
    current_user.green_points += result["points_awarded"]
    reward_tx = models.RewardTransaction(
        user_id=current_user.id,
        tree_id=tree.id,
        amount_points=result["points_awarded"],
        tx_type="EARNED",
        reason=f"Day {req.milestone_day} verified survival reward for {tree.code}",
        blockchain_tx_hash=result["blockchain_tx_hash"]
    )
    db.add(reward_tx)

    # 4. Notification
    notif = models.Notification(
        user_id=current_user.id,
        title=f"Survival Milestone Check Complete! 🌳",
        message=f"{tree.code} verified alive at Day {req.milestone_day} (+{result['growth_estimate_pct']}% growth). +{result['points_awarded']} GreenPoints earned!",
        notif_type="REWARD"
    )
    db.add(notif)

    db.commit()

    return schemas.SurvivalCheckResponse(
        tree_id=tree.id,
        same_tree_probability=result["same_tree_probability"],
        health_score=result["health_score"],
        health_status=result["health_status"],
        growth_estimate_pct=result["growth_estimate_pct"],
        leaf_condition=result["leaf_condition"],
        points_awarded=result["points_awarded"],
        blockchain_tx_hash=result["blockchain_tx_hash"]
    )

@router.get("/upcoming")
def get_upcoming_verifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns user's trees that have milestone survival verifications pending or due.
    """
    user_trees = db.query(models.Tree).filter(models.Tree.planter_id == current_user.id).limit(10).all()
    upcoming = []
    milestones = [30, 90, 180, 365]

    for tree in user_trees:
        for m in milestones:
            if tree.days_alive < m:
                days_left = m - tree.days_alive
                upcoming.append({
                    "tree_id": tree.id,
                    "tree_code": tree.code,
                    "species": tree.species,
                    "target_milestone": f"Day {m}",
                    "days_remaining": days_left,
                    "health_status": tree.health_status,
                    "reward_points": 30 if m == 30 else (40 if m == 90 else (60 if m == 180 else 100))
                })
                break

    return upcoming
