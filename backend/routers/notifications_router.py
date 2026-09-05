from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[schemas.NotificationResponse])
def get_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.id.desc()).limit(20).all()
    
    if not notifs:
        # Default welcome notification
        return [
            schemas.NotificationResponse(
                id=1,
                title="Welcome to GreenProof Platform 🌱",
                message="Plant your first native tree or complete survival checks to start earning verified GreenPoints.",
                notif_type="REWARD",
                is_read=False,
                created_at=models.datetime.datetime.utcnow()
            )
        ]
    return notifs

@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "SUCCESS"}
