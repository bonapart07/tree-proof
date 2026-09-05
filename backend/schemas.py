from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

# Auth & User Schemas
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "citizen"
    district: Optional[str] = "Kamrup Metro"
    state: Optional[str] = "Assam"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    green_points: int

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    avatar: Optional[str] = None
    district: str
    state: str
    green_points: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Tree Schemas
class TreeCreate(BaseModel):
    species: str
    scientific_name: Optional[str] = None
    latitude: float
    longitude: float
    gps_accuracy_m: Optional[float] = 3.2
    location_name: Optional[str] = "Guwahati, Assam"
    district: Optional[str] = "Kamrup"
    state: Optional[str] = "Assam"
    image_url: Optional[str] = None
    campaign_id: Optional[int] = None
    org_id: Optional[int] = None

class TreeResponse(BaseModel):
    id: int
    code: str
    species: str
    scientific_name: Optional[str]
    planter_id: int
    latitude: float
    longitude: float
    gps_accuracy_m: float
    location_name: str
    district: str
    state: str
    health_status: str
    health_score: int
    days_alive: int
    co2_absorbed_kg: float
    height_cm: float
    canopy_diameter_cm: float
    image_url: Optional[str]
    qr_code_url: Optional[str]
    blockchain_tx_hash: Optional[str]
    planted_at: datetime
    last_verified_at: datetime

    class Config:
        from_attributes = True

class TreeDetailResponse(TreeResponse):
    planter_name: Optional[str] = "Aarav Sharma"
    planter_avatar: Optional[str] = None
    verifications_count: int = 1
    growth_history: List[dict] = []

# AI Verification Schemas
class AIVerifyRequest(BaseModel):
    image_soil_base64: Optional[str] = None
    image_action_base64: Optional[str] = None
    image_planted_base64: Optional[str] = None
    latitude: float
    longitude: float
    species_hint: Optional[str] = "Neem"
    timestamp: Optional[datetime] = None

class AIVerifyResponse(BaseModel):
    plant_detected: bool
    confidence: float
    image_authenticity_score: float
    duplicate_probability: float
    manipulation_probability: float
    verification_score: int
    status: str # verified, manual_review, rejected
    species_identified: str
    chlorophyll_index: float
    fraud_risk: str # LOW, MEDIUM, HIGH
    blockchain_hash: str

# Survival Check Schemas
class SurvivalCheckRequest(BaseModel):
    tree_id: int
    image_url: str
    milestone_day: int # 30, 90, 180, 365
    latitude: float
    longitude: float

class SurvivalCheckResponse(BaseModel):
    tree_id: int
    same_tree_probability: float
    health_score: int
    health_status: str
    growth_estimate_pct: float
    leaf_condition: str
    points_awarded: int
    blockchain_tx_hash: str

# Rewards Schemas
class RewardTransactionResponse(BaseModel):
    id: int
    amount_points: int
    tx_type: str
    reason: str
    blockchain_tx_hash: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class RedeemRequest(BaseModel):
    reward_item_id: str
    points_cost: int
    reward_title: str

# Campaign Schemas
class CampaignCreate(BaseModel):
    title: str
    description: Optional[str] = None
    budget_inr: float
    target_trees: int
    region: str

class CampaignResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    budget_inr: float
    target_trees: int
    verified_trees: int
    surviving_trees: int
    survival_rate: float
    region: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Leaderboard Schemas
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    name: str
    avatar: Optional[str]
    surviving_trees: int
    survival_rate: float
    carbon_offset_tons: float
    green_points: int
    district: str
    state: str

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notif_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Fraud Report Schemas
class FraudReportResponse(BaseModel):
    id: int
    tree_id: int
    tree_code: str
    risk_level: str
    reasons: str
    status: str
    created_at: datetime
