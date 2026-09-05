import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen") # citizen, ngo, sponsor, admin
    avatar = Column(String(500), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    district = Column(String(100), default="Kamrup Metro")
    state = Column(String(100), default="Assam")
    green_points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    trees = relationship("Tree", back_populates="planter")
    rewards = relationship("RewardTransaction", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    organization = relationship("Organization", back_populates="members")

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    org_type = Column(String(50), default="NGO") # NGO, SHG, Government, Educational
    registration_number = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=True)
    verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    members = relationship("User", back_populates="organization")
    trees = relationship("Tree", back_populates="organization")
    campaigns = relationship("Campaign", back_populates="organization")

class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    company_logo = Column(String(500), nullable=True)
    total_funded_inr = Column(Float, default=0.0)
    contact_person = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    campaigns = relationship("Campaign", back_populates="sponsor")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    sponsor_id = Column(Integer, ForeignKey("sponsors.id"), nullable=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    budget_inr = Column(Float, default=1000000.0)
    target_trees = Column(Integer, default=10000)
    verified_trees = Column(Integer, default=0)
    surviving_trees = Column(Integer, default=0)
    survival_rate = Column(Float, default=0.0)
    region = Column(String(255), default="Assam & North East Corridors")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sponsor = relationship("Sponsor", back_populates="campaigns")
    organization = relationship("Organization", back_populates="campaigns")
    trees = relationship("Tree", back_populates="campaign")

class Tree(Base):
    __tablename__ = "trees"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. TREE-AS-000001
    species = Column(String(100), nullable=False)
    scientific_name = Column(String(150), nullable=True)
    planter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    gps_accuracy_m = Column(Float, default=3.2)
    location_name = Column(String(255), default="Guwahati Forest Belt")
    district = Column(String(100), default="Kamrup")
    state = Column(String(100), default="Assam")

    health_status = Column(String(50), default="Healthy") # Healthy, Needs Attention, Critical, Dead, Under Review
    health_score = Column(Integer, default=92) # 0 to 100
    days_alive = Column(Integer, default=1)
    co2_absorbed_kg = Column(Float, default=5.0)
    height_cm = Column(Float, default=35.0)
    canopy_diameter_cm = Column(Float, default=25.0)

    image_url = Column(String(500), nullable=True)
    qr_code_url = Column(String(500), nullable=True)
    blockchain_tx_hash = Column(String(100), nullable=True)
    planted_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_verified_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    planter = relationship("User", back_populates="trees")
    organization = relationship("Organization", back_populates="trees")
    campaign = relationship("Campaign", back_populates="trees")
    events = relationship("PlantationEvent", back_populates="tree", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="tree", cascade="all, delete-orphan")
    health_assessments = relationship("HealthAssessment", back_populates="tree", cascade="all, delete-orphan")
    fraud_reports = relationship("FraudReport", back_populates="tree", cascade="all, delete-orphan")

class PlantationEvent(Base):
    __tablename__ = "plantation_events"

    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id"), nullable=False)
    event_type = Column(String(50), default="INITIAL_PLANTATION") # INITIAL_PLANTATION, SURVIVAL_CHECK, TREATMENT
    image_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    tree = relationship("Tree", back_populates="events")

class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id"), nullable=False)
    verification_type = Column(String(50), default="initial") # initial, 30d, 90d, 180d, 365d
    plant_detected = Column(Boolean, default=True)
    confidence = Column(Float, default=0.94)
    image_authenticity_score = Column(Float, default=0.91)
    duplicate_probability = Column(Float, default=0.03)
    manipulation_probability = Column(Float, default=0.02)
    verification_score = Column(Integer, default=94)
    status = Column(String(50), default="verified") # verified, manual_review, rejected
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tree = relationship("Tree", back_populates="verifications")

class HealthAssessment(Base):
    __tablename__ = "health_assessments"

    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id"), nullable=False)
    health_score = Column(Integer, default=87)
    leaf_condition = Column(String(50), default="Lush Green")
    canopy_growth_pct = Column(Float, default=12.0)
    damage_detected = Column(Boolean, default=False)
    ai_notes = Column(Text, nullable=True)
    assessed_at = Column(DateTime, default=datetime.datetime.utcnow)

    tree = relationship("Tree", back_populates="health_assessments")

class RewardPool(Base):
    __tablename__ = "reward_pools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="General Environmental Pool")
    total_budget_usd = Column(Float, default=50000.0)
    remaining_budget_usd = Column(Float, default=44500.0)
    point_rate_usd = Column(Float, default=0.05) # 1 GP = $0.05
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class RewardTransaction(Base):
    __tablename__ = "reward_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tree_id = Column(Integer, ForeignKey("trees.id"), nullable=True)
    amount_points = Column(Integer, nullable=False)
    tx_type = Column(String(50), default="EARNED") # EARNED, REDEEMED
    reason = Column(String(255), default="Initial verified plantation")
    blockchain_tx_hash = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="rewards")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notif_type = Column(String(50), default="VERIFICATION") # VERIFICATION, REWARD, SURVIVAL_DUE, ALERT
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id"), nullable=False)
    risk_level = Column(String(50), default="LOW") # LOW, MEDIUM, HIGH
    reasons = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, DISMISSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tree = relationship("Tree", back_populates="fraud_reports")

class BlockchainTransaction(Base):
    __tablename__ = "blockchain_transactions"

    id = Column(Integer, primary_key=True, index=True)
    tx_hash = Column(String(100), unique=True, index=True, nullable=False)
    block_number = Column(Integer, default=1849204)
    contract_address = Column(String(100), default="0x71C2Db194300a29487c95bF2Fe44F3a921d")
    function_name = Column(String(100), default="recordVerifiedTree")
    payload_hash = Column(String(100), nullable=True)
    status = Column(String(50), default="SUCCESS")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
