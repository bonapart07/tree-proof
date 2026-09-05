# GreenProof — AI-Powered Tree Plantation & Environmental Reward Platform

> **Smart India Hackathon (SIH 2026)**
> **Core Concept:** PLANT → PROVE → PROTECT → REWARD
> **Primary Impact Principle:** The primary metric is NOT "Trees Planted"; it is **"Verified Trees Surviving"**.

---

## 🌍 Product Overview

**GreenProof** is a full-stack, enterprise-grade environmental verification platform that combines **Dual-Band GNSS Geolocation**, **Neural Computer Vision**, **Temporal Survival Differentials**, and a **Transparent Blockchain Audit Layer** to transform physical tree plantations into auditable, living digital environmental assets.

---

## 🏗️ Architecture & Technology Stack

```
tree proof/
├── frontend/             # Next.js 16 (Turbopack), TypeScript, Tailwind CSS, Three.js, Recharts
│   ├── src/app/          # App router, layouts, view orchestration
│   ├── src/components/   # 3D WebGL scenes, interactive role portals, UI cards
│   └── src/lib/          # API client, sound synthesizer, procedural textures
├── backend/              # Python FastAPI, SQLAlchemy ORM, JWT RBAC
│   ├── routers/          # Auth, Trees, AI Verification, Survival, Rewards, Campaigns, Admin
│   ├── models.py         # 13 Relational Database Models
│   ├── schemas.py        # Pydantic Request/Response Validation Schemas
│   ├── database.py       # Engine & Session (SQLite zero-config or PostgreSQL)
│   └── seed.py           # 2,050 Seeded Trees across Indian districts
├── ai-service/           # Neural Computer Vision & Anti-Fraud Engine
│   └── vision_engine.py  # Chlorophyll spectral analysis, perceptual hashing, survival differential
└── blockchain/           # EVM Transparent Audit Layer
    ├── contracts/        # GreenProofTreeAudit.sol
    └── web3_client.py    # Python Web3 client with testnet simulation
```

---

## 👥 Role-Based Access Portals (RBAC)

GreenProof includes 4 complete role-based portals accessible via the **top demo persona ribbon**:

1. **👤 Citizen / Planter Portal** (`/dashboard`):
   - **4 Top KPI Cards:** 🌱 Trees Planted (24), 🌳 Trees Surviving (21), 🏆 GreenPoints (1,240), 🌍 Impact Score (87).
   - Recent plantations with health status and links to digital tree passports.
   - Upcoming survival verification countdowns (Day 30/90/180/365).
   - GreenPoints reward redemption & daily staking claim (+30 GP).

2. **🏢 NGO / SHG Portal** (`/ngo`):
   - Organization Profile: *Aranya Wildlife & Reforestation Trust*.
   - **Bulk Plantation Registration:** Multi-tree registration modal with GPS batch assignment or CSV upload.
   - Field assignment queue: 48 active rangers, 1,840 managed trees, 92.4% verified survival rate.

3. **💼 Corporate Sponsor / CSR Portal** (`/sponsor`):
   - Campaign: *Green Assam 2027* (Tata CleanTech & Sustainability).
   - **Budget:** ₹10,00,000 | **Target:** 10,000 Trees | **Verified:** 8,742 | **Surviving:** 7,981 | **Survival Rate:** 91.3%.
   - Recharts visual analytics: Monthly verified tree progression & carbon sequestration (114.8 Tons CO₂).
   - **Export ESG Audit Pack:** Instant modal generating compliant GHG Protocol & ISO 14064 certification.

4. **🏛️ Government & Admin Telemetry Console** (`/admin`):
   - **Verification Queue:** Flagged submissions review (Approve, Reject, Request Reverification).
   - **Anti-Fraud Engine:** High/Medium risk detection for duplicate image perceptual hashes, GPS travel velocity alerts, and lighting anomalies.
   - System-wide telemetry: 2,050 planted, 1,880 surviving, 91.7% survival rate across Indian corridors.

---

## 🌿 The 6-Step Guided Plantation Flow (`/verify`)

1. **Step 1 — Select Species:** Native species (Neem, Banyan, Mango, Jackfruit, Bamboo, Teak) with CO₂ sequestration factors.
2. **Step 2 — Capture Evidence:** Real-time camera viewfinder or photo proof with tamper-resistant timestamp.
3. **Step 3 — Geolocation Proof:** Browser dual-band GNSS fetch (lat, lng, accuracy radius ±3.2m).
4. **Step 4 — AI Computer Vision:** Real-time laser scanning animation, chlorophyll vegetative index (ExG), duplicate perceptual image check, manipulation risk check.
5. **Step 5 — Digital Tree Passport:** Generates permanent ID (e.g., `TREE-AS-000001`) with QR Code and blockchain audit hash.
6. **Step 6 — Reward Minted:** +20 GreenPoints awarded with celebratory audio & particle burst.

---

## 🗺️ Fullscreen Geospatial Plantation Map (`/map`)

- Visualizes **2,050+ trees** across Indian ecological corridors (Assam, Western Ghats, Sundarbans, Aravalli, Nilgiris).
- **Color-Coded Status Markers:**
  - 🟢 **Healthy**
  - 🟡 **Needs Attention**
  - 🔴 **Critical**
  - ⚫ **Dead**
- **Multi-Filters:** By Species, Health Status, and District.
- **Heatmap Mode:** Seamless toggle between individual markers and thermal biomass density view.
- **Specimen Drawer:** Click any pin to open 3D digital twin preview and jump to full Tree Details.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ with pip

### 1. Launch FastAPI Backend (Port 8000)
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Note: The backend automatically seeds 2,050 trees, sample users, campaigns, and fraud reports on first launch.*

### 2. Launch Next.js Frontend (Port 3000)
```powershell
npm run dev
```

### 3. Open in Browser
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Interactive API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 📜 Smart Contract Specification (`GreenProofTreeAudit.sol`)

- `recordVerifiedTree(string treeId, bytes32 metadataHash, string species, int256 lat, int256 lng, address planter)`
- `issueReward(address recipient, uint256 greenPoints, string milestone)`
- `recordSurvivalVerification(string treeId, uint256 milestoneDay, uint256 healthScore, bytes32 photoAuditHash)`
- `recordRedemption(address user, uint256 pointsBurned, string rewardType)`

*Personal identifying information is never stored on-chain; only cryptographic SHA-256 hashes and environmental metrics are immutably audited.*
