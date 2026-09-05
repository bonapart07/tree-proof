import random
import datetime
import hashlib
from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
import models
import auth

SPECIES_DATA = [
    ("Neem", "Azadirachta indica", 1.8),
    ("Banyan", "Ficus benghalensis", 3.2),
    ("Mango", "Mangifera indica", 2.1),
    ("Jackfruit", "Artocarpus heterophyllus", 2.4),
    ("Bamboo", "Bambusa vulgaris", 4.0),
    ("Teak", "Tectona grandis", 2.8),
    ("Sal", "Shorea robusta", 2.5),
    ("Peepal", "Ficus religiosa", 3.0),
    ("Khejri", "Prosopis cineraria", 1.6),
    ("Sundari", "Heritiera fomes", 2.0),
]

REGIONS = [
    {"district": "Kamrup Metro", "state": "Assam", "lat": 26.1445, "lng": 91.7362, "location": "Guwahati Bio-Reserve"},
    {"district": "Sonitpur", "state": "Assam", "lat": 26.6528, "lng": 92.7926, "location": "Nameri Foothills Corridor"},
    {"district": "Jorhat", "state": "Assam", "lat": 26.7509, "lng": 94.2037, "location": "Brahmaputra Floodplain"},
    {"district": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567, "location": "Western Ghats Ridge Reserve"},
    {"district": "Wayanad", "state": "Kerala", "lat": 11.6854, "lng": 76.1320, "location": "Nilgiri Biosphere Buffer"},
    {"district": "South 24 Parganas", "state": "West Bengal", "lat": 21.9497, "lng": 89.1833, "location": "Sundarbans Delta Zone"},
    {"district": "Gurugram", "state": "Haryana", "lat": 28.4595, "lng": 77.0266, "location": "Aravalli Biodiversity Wall"},
    {"district": "Hoshangabad", "state": "Madhya Pradesh", "lat": 22.4578, "lng": 77.7289, "location": "Satpura Wildlife Corridor"},
]

SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop&q=80"
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    existing_count = db.query(models.Tree).count()
    if existing_count >= 2000:
        print(f"Database already seeded with {existing_count} trees. Skipping.")
        db.close()
        return

    print("Seeding GreenProof database with 2,000+ realistic tree plantations and multi-role demo accounts...")

    # 1. Seed Organizations
    org_aranya = models.Organization(
        name="Aranya Wildlife & Reforestation Trust",
        org_type="NGO",
        registration_number="NGO-AS-2018-9941",
        contact_email="coordinator@aranyawildlife.org",
        verified=True
    )
    org_assam = models.Organization(
        name="Assam Eco-Restoration Society",
        org_type="SHG",
        registration_number="SHG-AS-2021-1204",
        contact_email="contact@assameco.org",
        verified=True
    )
    db.add_all([org_aranya, org_assam])
    db.commit()

    # 2. Seed Corporate Sponsors
    sponsor_tata = models.Sponsor(
        name="Tata CleanTech & Sustainability",
        company_logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        total_funded_inr=1500000.0,
        contact_person="Ratan Roy"
    )
    sponsor_mahindra = models.Sponsor(
        name="Mahindra EcoDrive Foundation",
        company_logo="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80",
        total_funded_inr=800000.0,
        contact_person="Anita Deshmukh"
    )
    db.add_all([sponsor_tata, sponsor_mahindra])
    db.commit()

    # 3. Seed Campaigns
    campaign_horizon = models.Campaign(
        sponsor_id=sponsor_tata.id,
        org_id=org_aranya.id,
        title="Project Green Horizon 2026",
        description="Restoring 10,000 native biodiversity canopies across Assam degraded scrublands.",
        budget_inr=1000000.0,
        target_trees=10000,
        verified_trees=1840,
        surviving_trees=1680,
        survival_rate=91.3,
        region="Assam Ecological Corridors",
        is_active=True
    )
    db.add(campaign_horizon)
    db.commit()

    # 4. Seed Multi-Role Demo Users
    user_citizen = models.User(
        email="aarav@greenproof.eco",
        hashed_password=auth.hash_password("GreenProof2026!"),
        full_name="Aarav Sharma",
        role="citizen",
        avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        district="Kamrup Metro",
        state="Assam",
        green_points=1240
    )
    user_ngo = models.User(
        email="coordinator@aranyawildlife.org",
        hashed_password=auth.hash_password("GreenProof2026!"),
        full_name="Pranab Goswami",
        role="ngo",
        organization_id=org_aranya.id,
        avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        district="Sonitpur",
        state="Assam",
        green_points=4800
    )
    user_sponsor = models.User(
        email="csr@tatacleantech.com",
        hashed_password=auth.hash_password("GreenProof2026!"),
        full_name="Ratan Roy",
        role="sponsor",
        avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        district="Mumbai Suburban",
        state="Maharashtra",
        green_points=12000
    )
    user_admin = models.User(
        email="admin@greenproof.gov.in",
        hashed_password=auth.hash_password("GreenProof2026!"),
        full_name="Dr. Shreya Barua (IFS)",
        role="admin",
        avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        district="Kamrup Metro",
        state="Assam",
        green_points=9500
    )
    db.add_all([user_citizen, user_ngo, user_sponsor, user_admin])
    db.commit()

    # 5. Seed 2,050 Trees
    trees_batch = []
    statuses = ["Healthy"] * 1640 + ["Needs Attention"] * 240 + ["Critical"] * 110 + ["Dead"] * 60
    random.shuffle(statuses)

    base_time = datetime.datetime.utcnow()

    for i in range(1, 2051):
        sp_name, sp_sci, co2_factor = random.choice(SPECIES_DATA)
        reg = random.choice(REGIONS)
        status = statuses[i - 1]

        # Jitter coordinates slightly within district radius
        lat_jitter = reg["lat"] + (random.random() - 0.5) * 0.12
        lng_jitter = reg["lng"] + (random.random() - 0.5) * 0.12
        days = random.randint(5, 420)
        planted_dt = base_time - datetime.timedelta(days=days)

        health_score = 92 if status == "Healthy" else (72 if status == "Needs Attention" else (45 if status == "Critical" else 15))
        tree_code = f"TREE-AS-{i:06d}"
        tx_hash = "0x" + hashlib.sha256(f"{tree_code}_{days}".encode()).hexdigest()[:40]

        tree = models.Tree(
            code=tree_code,
            species=sp_name,
            scientific_name=sp_sci,
            planter_id=user_citizen.id if i <= 10 else user_ngo.id,
            org_id=org_aranya.id if (i % 2 == 0) else None,
            campaign_id=campaign_horizon.id if (i % 3 == 0) else None,
            latitude=round(lat_jitter, 5),
            longitude=round(lng_jitter, 5),
            gps_accuracy_m=round(2.1 + random.random() * 2.5, 1),
            location_name=f"{reg['location']}, {reg['district']}",
            district=reg["district"],
            state=reg["state"],
            health_status=status,
            health_score=health_score,
            days_alive=days,
            co2_absorbed_kg=round(days * 0.08 * co2_factor, 1),
            height_cm=round(25.0 + days * 0.55, 1),
            canopy_diameter_cm=round(18.0 + days * 0.38, 1),
            image_url=random.choice(SAMPLE_IMAGES),
            qr_code_url=f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={tree_code}",
            blockchain_tx_hash=tx_hash,
            planted_at=planted_dt,
            last_verified_at=base_time - datetime.timedelta(days=random.randint(0, 14))
        )
        trees_batch.append(tree)

        # Batch insert every 500 records
        if len(trees_batch) >= 500:
            db.bulk_save_objects(trees_batch)
            db.commit()
            trees_batch = []
            print(f"  -> Inserted batch... ({i}/2050)")

    if trees_batch:
        db.bulk_save_objects(trees_batch)
        db.commit()

    # 6. Seed Sample Fraud Reports
    fraud1 = models.FraudReport(
        tree_id=14,
        risk_level="HIGH",
        reasons="Perceptual image hash matches identical plantation image registered under TREE-AS-000008. Potential duplicate fraud.",
        status="PENDING"
    )
    fraud2 = models.FraudReport(
        tree_id=48,
        risk_level="HIGH",
        reasons="GPS velocity alert: Coordinates moved 120km within 5 minutes between photo captures.",
        status="PENDING"
    )
    fraud3 = models.FraudReport(
        tree_id=92,
        risk_level="MEDIUM",
        reasons="Chlorophyll variance discord: Foliage color saturation indicates plastic artificial foliage.",
        status="DISMISSED"
    )
    db.add_all([fraud1, fraud2, fraud3])
    db.commit()

    print("Seeding completed successfully! 2,050 trees ready across live districts.")
    db.close()

if __name__ == "__main__":
    seed_database()
