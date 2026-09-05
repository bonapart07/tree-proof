// Unified Tree Storage & Synchronization Manager
// Guarantees immediate local persistence across My Trees, 30-Day Survival Check, and Firestore

export interface StoredTree {
  id?: string;
  code: string;
  species: string;
  scientificName: string;
  planterUid?: string;
  planterName?: string;
  planterEmail?: string;
  plantedDate: string;
  plantedAt: number; // Milliseconds timestamp
  daysAlive: number;
  health: number;
  status: 'planted' | 'healthy' | 'moderate' | 'critical' | 'dead' | string;
  tokenVestingDays: number;
  vestingDaysLeft: number;
  lockedTokens: number;
  unlockedTokens: number;
  survivalVerified: boolean;
  verificationEligibleAt: number;
  locationName: string;
  district: string;
  state: string;
  coordinates: [number, number] | number[];
  altitude: number;
  co2AbsorbedKg?: number;
  heightCm?: number;
  canopyDiameterCm?: number;
  verificationScore?: number;
  aiReasoning?: string;
  deviceId?: string;
  hardwareHash?: string;
  layersVerified?: {
    layer1Soil: boolean;
    layer2Planting: boolean;
    layer3Planted: boolean;
  };
  proofPhotos?: {
    layer1Soil: string;
    layer2Planting: string;
    layer3Planted: string;
  };
  growthHistory?: Array<{
    day: number;
    imageUrl: string;
    note?: string;
  }>;
  txHash?: string;
  [key: string]: any;
}

const STORAGE_KEY = 'greenproof_saved_trees';
const DELETED_KEY = 'greenproof_deleted_trees';

/**
 * Get all deleted tree IDs/codes
 */
export function getDeletedTreeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DELETED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get all trees saved in local storage
 */
export function getLocalTrees(): StoredTree[] {
  if (typeof window === 'undefined') return [];
  try {
    const deleted = getDeletedTreeIds();
    const stored = localStorage.getItem(STORAGE_KEY);
    const trees: StoredTree[] = stored ? JSON.parse(stored) : [];
    return trees.filter(
      (t) => !deleted.includes(t.code) && (!t.id || !deleted.includes(t.id))
    );
  } catch {
    return [];
  }
}

/**
 * Save a newly registered tree locally with immediate persistence & event dispatch
 */
export function saveLocalTree(tree: StoredTree): StoredTree[] {
  if (typeof window === 'undefined') return [tree];
  try {
    const existing = getLocalTrees();
    // Check if tree already exists by code or id
    const filtered = existing.filter(
      (t) => t.code !== tree.code && (!tree.id || t.id !== tree.id)
    );
    const updated = [tree, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global event so all components update immediately
    window.dispatchEvent(
      new CustomEvent('greenproof_trees_updated', { detail: updated })
    );

    return updated;
  } catch (err) {
    console.warn('Could not save tree locally:', err);
    return [];
  }
}

/**
 * Update an existing tree (e.g. after Day 30 survival check passes)
 */
export function updateLocalTree(
  treeCode: string,
  updates: Partial<StoredTree>
): StoredTree[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getLocalTrees();
    const updated = existing.map((t) => {
      if (t.code === treeCode) {
        return {
          ...t,
          ...updates,
          growthHistory: updates.growthHistory || t.growthHistory || [
            {
              day: 0,
              imageUrl:
                t.proofPhotos?.layer3Planted ||
                t.proofPhotos?.layer1Soil ||
                ''
            }
          ]
        };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('greenproof_trees_updated', { detail: updated })
    );
    return updated;
  } catch (err) {
    console.warn('Could not update local tree:', err);
    return [];
  }
}

/**
 * Delete a tree by ID/Code
 */
export function deleteLocalTree(idOrCode: string): void {
  if (typeof window === 'undefined') return;
  try {
    const deleted = getDeletedTreeIds();
    if (!deleted.includes(idOrCode)) {
      deleted.push(idOrCode);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    }

    const current = getLocalTrees();
    const updated = current.filter(
      (t) => t.code !== idOrCode && t.id !== idOrCode
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('greenproof_trees_updated', { detail: updated })
    );
  } catch (err) {
    console.warn('Could not delete local tree:', err);
  }
}

/**
 * Robustly merge trees from Firestore and LocalStorage
 * Eliminates duplicates, respects deletions, and ensures newest trees are listed first
 */
export function mergeTreesWithLocal(firestoreTrees: any[]): StoredTree[] {
  const local = getLocalTrees();
  const deleted = getDeletedTreeIds();

  const map = new Map<string, StoredTree>();

  // 1. Add local trees first
  for (const t of local) {
    if (t.code && !deleted.includes(t.code) && (!t.id || !deleted.includes(t.id))) {
      map.set(t.code, t);
    }
  }

  // 2. Merge Firestore trees
  for (const f of firestoreTrees) {
    const code = f.code || (f.id ? `TREE-AS-${f.id.substring(0, 6).toUpperCase()}` : null);
    if (!code || deleted.includes(code) || (f.id && deleted.includes(f.id))) {
      continue;
    }

    const existingLocal = map.get(code);
    if (existingLocal) {
      // Merge: prefer latest verification status or growth history
      map.set(code, {
        ...existingLocal,
        ...f,
        id: f.id || existingLocal.id,
        survivalVerified: f.survivalVerified ?? existingLocal.survivalVerified,
        status: f.survivalVerified ? 'healthy' : existingLocal.status || 'planted',
        proofPhotos: f.proofPhotos || existingLocal.proofPhotos,
        growthHistory: f.growthHistory || existingLocal.growthHistory
      });
    } else {
      map.set(code, {
        id: f.id,
        code: code,
        species: f.species || 'Hollong',
        scientificName: f.scientificName || 'Dipterocarpus macrocarpus',
        plantedDate: f.plantedDate || 'Recent',
        plantedAt: f.plantedAt || (f.createdAt?.toMillis ? f.createdAt.toMillis() : Date.now()),
        daysAlive: f.daysAlive || 1,
        health: f.health || 96,
        status: f.survivalVerified ? 'healthy' : 'planted',
        tokenVestingDays: 30,
        vestingDaysLeft: Math.max(0, 30 - (f.daysAlive || 1)),
        lockedTokens: f.lockedTokens ?? 30,
        unlockedTokens: f.unlockedTokens ?? 0,
        survivalVerified: !!f.survivalVerified,
        verificationEligibleAt: f.verificationEligibleAt || Date.now() + 30 * 86400000,
        locationName: f.locationName || 'Kamrup Metropolitan, Assam',
        district: f.district || 'Kamrup Metropolitan',
        state: f.state || 'Assam',
        coordinates: f.coordinates || [26.1445, 91.7362],
        altitude: f.altitude || 54.0,
        co2AbsorbedKg: f.co2AbsorbedKg || 0.1,
        proofPhotos: f.proofPhotos,
        growthHistory: f.growthHistory || [
          {
            day: 0,
            imageUrl:
              f.proofPhotos?.layer3Planted ||
              f.proofPhotos?.layer1Soil ||
              ''
          }
        ]
      });
    }
  }

  const merged = Array.from(map.values());
  // Sort descending by plantedAt
  merged.sort((a, b) => (b.plantedAt || 0) - (a.plantedAt || 0));
  return merged;
}
