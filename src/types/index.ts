export type TreeHealth = 'healthy' | 'moderate' | 'critical' | 'dead';

export interface TreeData {
  id: string;
  code: string;
  species: string;
  scientificName: string;
  plantedDate: string;
  daysAlive: number;
  health: number; // 0 - 100
  status: TreeHealth;
  locationName: string;
  coordinates: [number, number]; // [lat, lng]
  planterName: string;
  planterAvatar: string;
  co2AbsorbedKg: number;
  heightCm: number;
  canopyDiameterCm: number;
  lastVerified: string;
  verificationScore: number;
  growthHistory: {
    day: number;
    heightCm: number;
    health: number;
    imageUrl?: string;
  }[];
}

export interface VerificationAnalysis {
  plantDetectionConfidence: number; // e.g. 94%
  imageAuthenticity: number; // e.g. 91%
  locationMatch: number; // e.g. 98%
  duplicateRisk: 'Low' | 'Medium' | 'High';
  chlorophyllIndex: number; // e.g. 0.82
  speciesIdentified: string;
  verifiedAt: string;
  hash: string;
}

export interface SurvivalComparison {
  treeCode: string;
  species: string;
  day1ImageUrl: string;
  day30ImageUrl: string;
  sameTreeConfidence: number; // e.g. 95%
  growthRatePercent: number; // e.g. +12%
  healthStatus: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'POOR';
  foliageIncrease: number; // e.g. 18%
  stemDiameterDeltaMm: number; // e.g. +3.4mm
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  badgeTitle: string;
  survivingTrees: number;
  survivalRate: number;
  carbonOffsetTons: number;
  greenPoints: number;
  region: string;
  treeModelScale: number;
}

export interface RewardItem {
  id: string;
  title: string;
  pointsCost: number;
  category: 'cash' | 'plant' | 'product' | 'discount' | 'donate';
  description: string;
  iconName: string;
  badge: string;
  impactTag: string;
}

export interface SponsorCampaign {
  id: string;
  corporateName: string;
  logo: string;
  campaignTitle: string;
  budgetUsd: number;
  treesSponsored: number;
  verifiedTrees: number;
  survivingTrees: number;
  survivalRate: number;
  targetCarbonTons: number;
  currentCarbonTons: number;
  region: string;
}

export interface AdminTelemetry {
  pendingVerifications: number;
  aiAccuracyRate: number;
  gpsSpoofingBlocked: number;
  satelliteCrossMatched: number;
  dailyActiveRangers: number;
  recentFlags: {
    id: string;
    treeCode: string;
    flagType: 'EXIF_MISMATCH' | 'LIGHTING_ANOMALY' | 'DUPLICATE_CLUSTER' | 'SPECIES_DISCORD';
    riskScore: number;
    timestamp: string;
    status: 'investigating' | 'dismissed' | 'rejected';
  }[];
}
