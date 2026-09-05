// Frontend API client for GreenProof Backend with auto-fallback to mock data if offline

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchWithFallback<T>(endpoint: string, options: RequestInit = {}, fallbackData: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      console.warn(`API call to ${endpoint} returned ${res.status}. Using fallback.`);
      return fallbackData;
    }
    return await res.json();
  } catch (err) {
    // Backend offline or unreachable, return robust fallback data
    return fallbackData;
  }
}

export const api = {
  // Trees
  getSummaryStats: async () => {
    return fetchWithFallback('/api/trees/stats/summary', {}, {
      trees_planted: 24832,
      trees_verified: 21492,
      trees_surviving: 18931,
      survival_rate: 88.0,
      co2_impact_kg: 42300.0,
      co2_impact_tons: 42.3,
      active_planters: 412
    });
  },

  getTrees: async (species = 'all', health = 'all', district = 'all', search = '') => {
    const params = new URLSearchParams();
    if (species !== 'all') params.append('species', species);
    if (health !== 'all') params.append('health_status', health);
    if (district !== 'all') params.append('district', district);
    if (search) params.append('search', search);

    return fetchWithFallback(`/api/trees?${params.toString()}&limit=60`, {}, []);
  },

  getTreeByCode: async (code: string) => {
    return fetchWithFallback(`/api/trees/${code}`, {}, null);
  },

  plantTree: async (treeData: {
    species: string;
    latitude: number;
    longitude: number;
    location_name?: string;
    district?: string;
    state?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
      },
      body: JSON.stringify(treeData)
    });
    if (!res.ok) {
      // Return simulated tree creation if backend not authenticated
      const randId = Math.floor(1000 + Math.random() * 9000);
      return {
        id: randId,
        code: `TREE-AS-${randId.toString().padStart(6, '0')}`,
        species: treeData.species,
        scientific_name: 'Plantae indet.',
        latitude: treeData.latitude,
        longitude: treeData.longitude,
        location_name: treeData.location_name || 'Guwahati Ecological Corridor',
        health_status: 'Healthy',
        health_score: 94,
        days_alive: 1,
        co2_absorbed_kg: 1.2,
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TREE-AS-${randId}`,
        blockchain_tx_hash: `0x${Math.random().toString(16).substring(2, 42)}`,
        planted_at: new Date().toISOString()
      };
    }
    return res.json();
  },

  // AI Verification
  verifyAI: async (payload: {
    latitude: number;
    longitude: number;
    species_hint?: string;
    image_base64?: string;
    device_id?: string;
    layers?: any;
  }) => {
    return fetchWithFallback('/api/verifications/verify-ai', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      plant_detected: true,
      confidence: 0.94,
      image_authenticity_score: 0.91,
      duplicate_probability: 0.03,
      manipulation_probability: 0.02,
      verification_score: 94,
      status: 'verified',
      species_identified: payload.species_hint || 'Neem',
      chlorophyll_index: 0.88,
      fraud_risk: 'LOW',
      blockchain_hash: '0x35e07ce03f1ec59a21e6c0a43539275a65dce1f6'
    });
  },

  // Survival Check
  submitSurvivalCheck: async (payload: { tree_id: number; milestone_day: number; latitude: number; longitude: number }) => {
    return fetchWithFallback('/api/survival/check', {
      method: 'POST',
      body: JSON.stringify({ ...payload, image_url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d' })
    }, {
      tree_id: payload.tree_id,
      same_tree_probability: 0.95,
      health_score: 88,
      health_status: 'OPTIMAL',
      growth_estimate_pct: 12.0,
      leaf_condition: 'Lush Green Foliage',
      points_awarded: 30,
      blockchain_tx_hash: '0x88f12c904bb3a01f92e448b301c29e4d01aa8923'
    });
  },

  // Rewards
  getWallet: async () => {
    return fetchWithFallback('/api/rewards/wallet', {
      headers: { 'Authorization': 'Bearer demo-token' }
    }, {
      green_points: 1240,
      estimated_value_usd: 62.0,
      total_earned: 1420,
      total_redeemed: 180,
      pending_points: 60,
      transactions: [
        { id: 1, amount_points: 30, tx_type: 'EARNED', reason: 'Day 30 survival check TREE-AS-000001', blockchain_tx_hash: '0x49f2...99a1', created_at: new Date().toISOString() },
        { id: 2, amount_points: 20, tx_type: 'EARNED', reason: 'Initial verified plantation TREE-AS-000002', blockchain_tx_hash: '0x12a8...44b2', created_at: new Date().toISOString() }
      ]
    });
  },

  claimDailyStaking: async () => {
    return fetchWithFallback('/api/rewards/claim-daily', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer demo-token' }
    }, {
      status: 'SUCCESS',
      points_claimed: 30,
      new_balance: 1270,
      blockchain_tx_hash: '0x77c2...e810'
    });
  },

  redeemReward: async (itemId: string, points: number, title: string) => {
    return fetchWithFallback('/api/rewards/redeem', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer demo-token' },
      body: JSON.stringify({ reward_item_id: itemId, points_cost: points, reward_title: title })
    }, {
      status: 'SUCCESS',
      reward_title: title,
      points_burned: points,
      remaining_balance: 1240 - points,
      blockchain_tx_hash: '0x99a1...ff32'
    });
  },

  // Campaigns
  getCampaigns: async () => {
    return fetchWithFallback('/api/campaigns', {}, [
      {
        id: 1,
        title: 'Project Green Horizon 2026',
        description: 'Reforestation of degraded scrublands across Assam & Western Ghats with native flora.',
        budget_inr: 1000000.0,
        target_trees: 10000,
        verified_trees: 8742,
        surviving_trees: 7981,
        survival_rate: 91.3,
        region: 'Assam Ecological Corridors',
        is_active: true
      }
    ]);
  },

  // Leaderboard
  getLeaderboard: async (scope = 'global') => {
    return fetchWithFallback(`/api/leaderboard?scope=${scope}`, {}, []);
  },

  // Admin Queue & Analytics
  getAdminAnalytics: async () => {
    return fetchWithFallback('/api/admin/analytics', {
      headers: { 'Authorization': 'Bearer demo-admin' }
    }, {
      total_plantations: 24832,
      total_surviving: 18931,
      survival_rate: 88.0,
      ai_accuracy_rate: 97.4,
      gps_spoofing_blocked: 38,
      satellite_cross_matched: 18940,
      daily_active_rangers: 412,
      health_distribution: { healthy: 16200, needs_attention: 2731, critical: 1240, dead: 642 },
      species_breakdown: [
        { species: 'Neem', count: 8420 },
        { species: 'Banyan', count: 5120 },
        { species: 'Teak', count: 4890 },
        { species: 'Sal', count: 3940 },
        { species: 'Sundari', count: 2462 }
      ]
    });
  },

  getVerificationQueue: async () => {
    return fetchWithFallback('/api/verifications/queue', {
      headers: { 'Authorization': 'Bearer demo-admin' }
    }, [
      {
        id: 1,
        tree_id: 102,
        tree_code: 'TREE-DL-009982',
        species: 'Neem',
        verification_type: 'initial',
        confidence: 0.74,
        image_authenticity_score: 0.68,
        duplicate_probability: 0.42,
        verification_score: 68,
        status: 'manual_review',
        location_name: 'Delhi Ridge Sanctuary',
        image_url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        tree_id: 144,
        tree_code: 'TREE-UP-004412',
        species: 'Peepal',
        verification_type: '30d',
        confidence: 0.65,
        image_authenticity_score: 0.62,
        duplicate_probability: 0.15,
        verification_score: 64,
        status: 'manual_review',
        location_name: 'Mathura Forest Buffer',
        image_url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString()
      }
    ]);
  },

  getFraudReports: async () => {
    return fetchWithFallback('/api/admin/fraud-reports', {
      headers: { 'Authorization': 'Bearer demo-admin' }
    }, [
      {
        id: 1,
        tree_id: 102,
        tree_code: 'TREE-DL-009982',
        risk_level: 'HIGH',
        reasons: 'Duplicate perceptual image hash matched with tree registered 2km away. EXIF lighting mismatch.',
        status: 'PENDING',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        tree_id: 144,
        tree_code: 'TREE-UP-004412',
        risk_level: 'HIGH',
        reasons: 'Impossible travel velocity detected: 2 submissions 80km apart within 3 minutes.',
        status: 'PENDING',
        created_at: new Date().toISOString()
      }
    ]);
  },

  resolveVerification: async (id: number, action: 'approve' | 'reject' | 'reverify') => {
    return fetchWithFallback(`/api/verifications/${id}/review?action=${action}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer demo-admin' }
    }, { status: 'SUCCESS', action, verification_id: id });
  }
};
