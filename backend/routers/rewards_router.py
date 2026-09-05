import hashlib
import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api/rewards", tags=["Rewards"])

@router.get("/wallet")
def get_user_wallet(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(models.RewardTransaction).filter(
        models.RewardTransaction.user_id == current_user.id
    ).order_by(models.RewardTransaction.id.desc()).limit(20).all()

    total_earned = sum([tx.amount_points for tx in transactions if tx.tx_type == "EARNED"])
    total_redeemed = sum([tx.amount_points for tx in transactions if tx.tx_type == "REDEEMED"])

    return {
        "green_points": current_user.green_points,
        "estimated_value_usd": round(current_user.green_points * 0.05, 2),
        "total_earned": total_earned,
        "total_redeemed": total_redeemed,
        "pending_points": 60, # Ongoing milestone staking
        "transactions": [
            {
                "id": tx.id,
                "amount_points": tx.amount_points,
                "tx_type": tx.tx_type,
                "reason": tx.reason,
                "blockchain_tx_hash": tx.blockchain_tx_hash,
                "created_at": tx.created_at
            }
            for tx in transactions
        ]
    }

@router.post("/claim-daily")
def claim_daily_staking_reward(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate daily yield based on active living trees
    active_trees_count = db.query(models.Tree).filter(
        models.Tree.planter_id == current_user.id,
        models.Tree.health_status.in_(["Healthy", "Needs Attention"])
    ).count()

    reward_amount = max(30, active_trees_count * 5)
    current_user.green_points += reward_amount

    tx_hash = "0x" + hashlib.sha256(f"staking_{current_user.id}_{time.time()}".encode()).hexdigest()[:40]

    tx = models.RewardTransaction(
        user_id=current_user.id,
        amount_points=reward_amount,
        tx_type="EARNED",
        reason=f"Daily survival staking yield for {active_trees_count} verified trees",
        blockchain_tx_hash=tx_hash
    )
    db.add(tx)

    notif = models.Notification(
        user_id=current_user.id,
        title="Daily Staking Claimed! 🍃",
        message=f"+{reward_amount} GreenPoints added to your wallet for keeping your trees alive.",
        notif_type="REWARD"
    )
    db.add(notif)
    db.commit()

    return {
        "status": "SUCCESS",
        "points_claimed": reward_amount,
        "new_balance": current_user.green_points,
        "blockchain_tx_hash": tx_hash
    }

@router.post("/redeem")
def redeem_reward(
    req: schemas.RedeemRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.green_points < req.points_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient GreenPoints. You have {current_user.green_points}, required {req.points_cost} GP."
        )

    current_user.green_points -= req.points_cost
    tx_hash = "0x" + hashlib.sha256(f"redeem_{req.reward_item_id}_{time.time()}".encode()).hexdigest()[:40]

    tx = models.RewardTransaction(
        user_id=current_user.id,
        amount_points=req.points_cost,
        tx_type="REDEEMED",
        reason=f"Redeemed: {req.reward_title}",
        blockchain_tx_hash=tx_hash
    )
    db.add(tx)

    notif = models.Notification(
        user_id=current_user.id,
        title="Reward Redeemed! 🎁",
        message=f"Successfully redeemed '{req.reward_title}' for {req.points_cost} GreenPoints. Delivery tracking issued.",
        notif_type="REWARD"
    )
    db.add(notif)
    db.commit()

    return {
        "status": "SUCCESS",
        "reward_title": req.reward_title,
        "points_burned": req.points_cost,
        "remaining_balance": current_user.green_points,
        "blockchain_tx_hash": tx_hash
    }

@router.get("/pools")
def get_reward_pools(db: Session = Depends(get_db)):
    pools = db.query(models.RewardPool).filter(models.RewardPool.is_active == True).all()
    if not pools:
        return [
            {
                "id": 1,
                "name": "Institutional CSR Reforestation Pool",
                "total_budget_usd": 125000.0,
                "remaining_budget_usd": 94800.0,
                "point_rate_usd": 0.05,
                "is_active": True
            }
        ]
    return pools
