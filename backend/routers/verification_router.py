import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-service")))
from vision_engine import ai_vision_engine

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api/verifications", tags=["AI Verification"])

@router.post("/verify-ai", response_model=schemas.AIVerifyResponse)
def run_ai_plantation_verification(req: schemas.AIVerifyRequest):
    """
    Direct endpoint for AI vision inference:
    Analyzes plant detection, image authenticity, duplicate detection, and fraud risk.
    """
    res = ai_vision_engine.verify_plantation(
        image_base64=req.image_base64,
        latitude=req.latitude,
        longitude=req.longitude,
        species_hint=req.species_hint or "Neem"
    )
    return res

@router.get("/queue")
def get_admin_verification_queue(
    current_user: models.User = Depends(auth.require_roles(["admin", "government"])),
    db: Session = Depends(get_db)
):
    """
    Admin verification queue showing flagged and pending plantation submissions.
    """
    pending = db.query(models.Verification).filter(
        models.Verification.status.in_(["manual_review", "pending"])
    ).order_by(models.Verification.id.desc()).limit(50).all()

    results = []
    for v in pending:
        tree = db.query(models.Tree).filter(models.Tree.id == v.tree_id).first()
        results.append({
            "id": v.id,
            "tree_id": v.tree_id,
            "tree_code": tree.code if tree else f"TREE-{v.tree_id}",
            "species": tree.species if tree else "Unknown",
            "verification_type": v.verification_type,
            "confidence": v.confidence,
            "image_authenticity_score": v.image_authenticity_score,
            "duplicate_probability": v.duplicate_probability,
            "verification_score": v.verification_score,
            "status": v.status,
            "created_at": v.created_at,
            "image_url": tree.image_url if tree else None,
            "location_name": tree.location_name if tree else "Assam"
        })
    return results

@router.post("/{verification_id}/review")
def review_verification(
    verification_id: int,
    action: str, # approve, reject, reverify
    notes: str = "",
    current_user: models.User = Depends(auth.require_roles(["admin", "government"])),
    db: Session = Depends(get_db)
):
    verif = db.query(models.Verification).filter(models.Verification.id == verification_id).first()
    if not verif:
        raise HTTPException(status_code=404, detail="Verification submission not found")

    tree = db.query(models.Tree).filter(models.Tree.id == verif.tree_id).first()

    if action == "approve":
        verif.status = "verified"
        if tree:
            tree.health_status = "Healthy"
    elif action == "reject":
        verif.status = "rejected"
        if tree:
            tree.health_status = "Dead"
    elif action == "reverify":
        verif.status = "manual_review"
        if tree:
            tree.health_status = "Under Review"

    verif.reviewer_id = current_user.id
    verif.notes = notes
    db.commit()

    return {"status": "SUCCESS", "action": action, "verification_id": verification_id}
