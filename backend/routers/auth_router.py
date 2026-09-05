from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.Token)
def register_user(req: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=req.email,
        hashed_password=auth.hash_password(req.password),
        full_name=req.full_name,
        role=req.role or "citizen",
        district=req.district or "Kamrup Metro",
        state=req.state or "Assam",
        green_points=100 # Welcome bonus
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initial welcome notification
    notif = models.Notification(
        user_id=user.id,
        title="Welcome to GreenProof!",
        message="Your account is active. Earn GreenPoints by planting and keeping native trees alive.",
        notif_type="REWARD"
    )
    db.add(notif)
    db.commit()

    token = auth.create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "green_points": user.green_points
    }

@router.post("/login", response_model=schemas.Token)
def login_user(req: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "green_points": user.green_points
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_current_profile(user: models.User = Depends(auth.get_current_user)):
    return user

@router.post("/demo-switch")
def switch_demo_role(role: str, db: Session = Depends(get_db)):
    """
    Allows rapid role-switching for Hackathon evaluators:
    Roles: citizen, ngo, sponsor, admin
    """
    valid_roles = ["citizen", "ngo", "sponsor", "admin"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {valid_roles}")

    user = db.query(models.User).filter(models.User.role == role).first()
    if not user:
        # Create user for this demo role if not exists
        user = models.User(
            email=f"demo_{role}@greenproof.eco",
            hashed_password=auth.hash_password("GreenProof2026!"),
            full_name=f"Demo {role.capitalize()} Officer",
            role=role,
            green_points=1240 if role == "citizen" else 5000,
            district="Kamrup Metro",
            state="Assam"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = auth.create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "green_points": user.green_points
    }

class FirebaseLoginRequest(schemas.BaseModel):
    email: str
    uid: str
    displayName: str = "Green Steward"
    role: str = "citizen"
    photoURL: str = ""

@router.post("/firebase-login", response_model=schemas.Token)
def login_with_firebase(req: FirebaseLoginRequest, db: Session = Depends(get_db)):
    """
    Syncs Firebase authenticated users (Google Sign-In or Email/Pass) into backend database.
    """
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        user = models.User(
            email=req.email,
            hashed_password=auth.hash_password(req.uid),
            full_name=req.displayName or "Green Steward",
            role=req.role or "citizen",
            avatar=req.photoURL or None,
            district="Kamrup Metro",
            state="Assam",
            green_points=1240
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Welcome notification
        notif = models.Notification(
            user_id=user.id,
            title="Firebase Account Connected! 🔥",
            message="Authenticated via Firebase & Firestore. You have 1,240 welcome GreenPoints.",
            notif_type="REWARD"
        )
        db.add(notif)
        db.commit()

    token = auth.create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "green_points": user.green_points
    }

