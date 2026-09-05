'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  Coins,
  RefreshCw,
  LogIn,
  UserCheck,
  Trash2,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { reverseGeocodeCoords } from '@/lib/geocoding';
import {
  auth,
  db,
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  onAuthStateChanged,
  signInWithGoogleReal,
  deleteTreeFromFirestore
} from '@/lib/firebase';
import CanvasWrapper from '@/components/3d/CanvasWrapper';
import HeroLeafScene, { GrowthStage } from '@/components/3d/HeroLeafScene';
import AuthModal from '@/components/ui/AuthModal';

const DEFAULT_TREE_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%2306140d'/%3E%3Ccircle cx='400' cy='300' r='120' fill='%2310b981' opacity='0.15'/%3E%3Cpath d='M400 180c-55 0-100 45-100 100 0 35 18 66 45 84v56h110v-56c27-18 45-49 45-84 0-55-45-100-100-100zm-10 180v40h20v-40h-20z' fill='%2310b981'/%3E%3Ctext x='400' y='460' font-family='monospace' font-size='20' fill='%236ee7b7' text-anchor='middle'%3EFIELD BOTANICAL SPECIMEN%3C/text%3E%3C/svg%3E";

interface UserDashboardViewProps {
  onNavigate: (view: string, data?: any) => void;
  onSelectTree?: (code: string) => void;
}

export default function UserDashboardView({ onNavigate }: UserDashboardViewProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);

  // 3D Botanical Stage for Empty Portfolio State
  const [botanicalStage, setBotanicalStage] = useState<GrowthStage>('seed');

  // User Profile State (Synced in Real-time)
  const [userProfile, setUserProfile] = useState({
    name: 'Green Steward',
    email: 'steward@greenproof.eco',
    state: 'Assam',
    district: 'Kamrup Metropolitan (Guwahati)',
    photoURL: '',
    greenPoints: 0
  });

  // KPI Metrics (Calculated dynamically from real plantations)
  const [stats, setStats] = useState({
    treesPlanted: 0,
    treesSurviving: 0,
    greenPoints: 0,
    lockedPoints: 0,
    survivalRate: 100
  });

  // Start with 0 mock trees: Only show user's real Firestore plantations
  const [realtimeTrees, setRealtimeTrees] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [loading, setLoading] = useState(false);

  // Deletion States
  const [deletedTreeIds, setDeletedTreeIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('greenproof_deleted_trees');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [treeToDelete, setTreeToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic KPI Stats Calculator
  const calculateStats = (treesList: any[]) => {
    const totalPlanted = treesList.length;
    const surviving = treesList.filter((t) => t.status === 'healthy' || t.survivalVerified).length;
    const lockedTotal = treesList
      .filter((t) => !t.survivalVerified)
      .reduce((acc, t) => acc + (t.lockedTokens ?? 30), 0);
    const rate = totalPlanted > 0 ? Number(((surviving / totalPlanted) * 100).toFixed(1)) : 100;

    setStats((prev) => ({
      ...prev,
      treesPlanted: totalPlanted,
      treesSurviving: surviving,
      lockedPoints: lockedTotal,
      survivalRate: rate
    }));
  };

  // Real-Time Firebase Auth & Firestore Listeners
  useEffect(() => {
    // 1. Check local session storage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('greenproof_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.name) {
            setUserProfile((prev) => ({
              ...prev,
              name: parsed.name,
              email: parsed.email || 'steward@greenproof.eco',
              state: parsed.state || 'Assam',
              district: parsed.district || 'Kamrup Metropolitan (Guwahati)',
              photoURL: parsed.photoURL || ''
            }));
            setCurrentUser(parsed);
          }
        } catch (e) {}
      }
    }

    // 2. Real-Time Firebase Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setUserProfile((prev) => ({
          ...prev,
          name: firebaseUser.displayName || prev.name,
          email: firebaseUser.email || prev.email,
          photoURL: firebaseUser.photoURL || prev.photoURL
        }));

        // 3. Real-Time Firestore User Profile Document Listener
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubscribeUserDoc = onSnapshot(
            userDocRef,
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setUserProfile((prev) => ({
                  ...prev,
                  name: data.displayName || firebaseUser.displayName || 'Green Planter',
                  email: data.email || firebaseUser.email || '',
                  state: data.state || 'Assam',
                  district: data.district || 'Kamrup Metropolitan (Guwahati)',
                  photoURL: data.photoURL || firebaseUser.photoURL || ''
                }));

                if (data.greenPoints !== undefined) {
                  setStats((prev) => ({
                    ...prev,
                    greenPoints: data.greenPoints
                  }));
                }
              }
            },
            (err) => {
              // Graceful offline/reconnecting fallback
            }
          );

          return () => unsubscribeUserDoc();
        } catch (err) {
          // Graceful fallback
        }
      }
    });

    // 4. Real-Time Firestore Live Plantations Listener
    try {
      const treesQuery = query(collection(db, 'trees'), orderBy('createdAt', 'desc'), limit(30));
      const unsubscribeTrees = onSnapshot(
        treesQuery,
        (snapshot) => {
          let fetchedTrees: any[] = [];
          if (!snapshot.empty) {
            fetchedTrees = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                code: data.code || `TREE-AS-${d.id.substring(0, 6).toUpperCase()}`,
                species: data.species || 'Hollong',
                scientificName: data.scientificName || 'Dipterocarpus macrocarpus',
                plantedDate: data.plantedDate || 'Recent',
                daysAlive: data.daysAlive || 1,
                health: data.health || 96,
                status: data.survivalVerified ? 'healthy' : 'moderate',
                locationName: data.locationName || 'Kamrup Metropolitan, Assam',
                coordinates: data.coordinates || [26.1445, 91.7362],
                co2AbsorbedKg: data.co2AbsorbedKg || 2.4,
                lockedTokens: data.lockedTokens ?? 30,
                unlockedTokens: data.unlockedTokens ?? 0,
                survivalVerified: !!data.survivalVerified,
                growthHistory: [
                  {
                    day: 0,
                    imageUrl:
                      data.proofPhotos?.layer3Planted ||
                      data.proofPhotos?.layer1Soil ||
                      DEFAULT_TREE_FALLBACK
                  }
                ]
              };
            });
          }

          let currentDeleted: string[] = [];
          if (typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem('greenproof_deleted_trees');
              currentDeleted = stored ? JSON.parse(stored) : [];
            } catch (e) {}
          }

          // Only take real trees from Firestore! (No mock trees)
          const combined = fetchedTrees.filter(
            (t) => !currentDeleted.includes(t.id) && !currentDeleted.includes(t.code)
          );

          setRealtimeTrees(combined);
          calculateStats(combined);
        },
        (err) => {
          // Graceful offline/reconnecting fallback
        }
      );

      return () => {
        unsubscribeAuth();
        unsubscribeTrees();
      };
    } catch (err) {
      return () => unsubscribeAuth();
    }
  }, []);

  const handleStartPlanting = () => {
    if (!currentUser) {
      soundManager.playLeafHover();
      setAuthPromptMessage('Login is mandatory to select a tree species and submit verified photographic proof.');
      setShowAuthModal(true);
      return;
    }
    soundManager.playRewardBurst();
    onNavigate('verify');
  };

  const handleInitiateDelete = (tree: any) => {
    soundManager.playLeafHover();
    setTreeToDelete(tree);
  };

  const handleConfirmDelete = async () => {
    if (!treeToDelete) return;
    setIsDeleting(true);

    try {
      // 1. If it has a Firestore document ID, delete from Firestore collection
      if (treeToDelete.id && !treeToDelete.id.startsWith('t-')) {
        await deleteTreeFromFirestore(treeToDelete.id);
      }

      // 2. Persist deletion in local storage for consistent experience
      const newDeleted = Array.from(
        new Set([...deletedTreeIds, treeToDelete.id, treeToDelete.code].filter(Boolean))
      );
      setDeletedTreeIds(newDeleted);
      if (typeof window !== 'undefined') {
        localStorage.setItem('greenproof_deleted_trees', JSON.stringify(newDeleted));
      }

      // 3. Update active trees state and recalculate dashboard KPIs
      const updatedTrees = realtimeTrees.filter(
        (t) => t.id !== treeToDelete.id && t.code !== treeToDelete.code
      );
      setRealtimeTrees(updatedTrees);
      calculateStats(updatedTrees);

      // 4. Sound & Toast Feedback
      soundManager.playRewardBurst();
      setToastMessage(`Tree ${treeToDelete.code} (${treeToDelete.species}) has been successfully deleted from your dashboard.`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Failed to delete tree:', err);
      setToastMessage('Failed to delete tree record. Please try again.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsDeleting(false);
      setTreeToDelete(null);
    }
  };

  const handle1ClickGoogleAuth = async () => {
    soundManager.playRewardBurst();
    try {
      const user = await signInWithGoogleReal();
      if (user) {
        setUserProfile((prev) => ({
          ...prev,
          name: user.displayName || 'Green Planter',
          email: user.email || '',
          photoURL: user.photoURL || ''
        }));
        setCurrentUser(user);
      }
    } catch (e) {
      setShowAuthModal(true);
    }
  };

  const filteredTrees = realtimeTrees.filter((t) => {
    if (selectedFilter === 'pending') return t.status === 'moderate' || t.daysAlive < 40 || !t.survivalVerified;
    if (selectedFilter === 'verified') return t.status === 'healthy' || t.survivalVerified;
    return true;
  });

  // Mandatory Login Gate: Unauthenticated users MUST log in before accessing plantation options
  if (!currentUser) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-lg mx-auto flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-2xl shadow-emerald-500/30">
          <div className="w-full h-full bg-[#06140c] rounded-[22px] flex items-center justify-center">
            <Sprout className="w-10 h-10 text-emerald-400 stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>AUTHENTICATION MANDATORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Planter Login Required
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-mono max-w-md mx-auto leading-relaxed">
            Please sign in to register your tree plantation with real device GPS locking, run AI botanical audits, and participate in 30-day token vesting.
          </p>
        </div>

        <div className="w-full glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-black/75 space-y-3 font-mono shadow-2xl">
          <button
            onClick={handle1ClickGoogleAuth}
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-black font-extrabold text-xs flex items-center justify-center gap-3 cursor-pointer shadow-xl transition-all hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full py-3.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In with Email / Password</span>
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-black px-2 text-slate-500">OR QUICK TESTING ACCESS</span>
            </div>
          </div>

          <button
            onClick={() => {
              const guestUser = {
                uid: 'guest-' + Math.random().toString(36).substring(2, 9),
                displayName: 'Verified Planter',
                email: 'planter@greenproof.eco',
                district: userProfile.district,
                state: userProfile.state
              };
              localStorage.setItem('greenproof_user', JSON.stringify(guestUser));
              setCurrentUser(guestUser);
              setUserProfile((p) => ({ ...p, name: guestUser.displayName, email: guestUser.email }));
              soundManager.playRewardBurst();
            }}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant Planter Access (Quick Test Session)</span>
          </button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(u) => {
            setCurrentUser(u);
            setUserProfile((prev) => ({
              ...prev,
              name: u.displayName || prev.name,
              email: u.email || prev.email,
              photoURL: u.photoURL || prev.photoURL
            }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 sm:pt-24 pb-16 px-3.5 sm:px-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* ================= USER WELCOME & ACTION HERO ================= */}
      <div className="p-4 sm:p-8 rounded-3xl glass-panel border border-emerald-500/25 bg-gradient-to-b from-[#06140c]/90 to-[#040e08]/90 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate">PLANTER PORTFOLIO • {userProfile.district}, {userProfile.state}</span>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Welcome back, <span className="text-emerald-400">{currentUser?.displayName || userProfile.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-mono">
            Track your living plantations in {userProfile.state}, verify 30-day survival milestones, and unlock staked GreenPoints.
          </p>
        </div>

        {/* Quick Action CTA Buttons (Full-width on mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={handleStartPlanting}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs font-mono shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Sprout className="w-4 h-4 stroke-[2.5]" />
            <span>+ Plant & Prove New Tree</span>
          </button>

          <button
            onClick={() => {
              soundManager.playLeafHover();
              onNavigate('survival');
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs font-mono transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Day 30 Survival Checks</span>
          </button>
        </div>
      </div>

      {/* ================= 4 CORE KPI METRIC CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Planted */}
        <div className="p-3.5 sm:p-5 rounded-2xl glass-panel border border-white/10 bg-black/40 space-y-1">
          <span className="text-slate-400 font-mono text-[11px] sm:text-xs uppercase flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Total Planted</span>
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">{stats.treesPlanted}</div>
          <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono block truncate">
            {stats.treesPlanted > 0 ? '100% Geo & AI Verified' : 'Awaiting first tree'}
          </span>
        </div>

        {/* Verified Surviving */}
        <div className="p-3.5 sm:p-5 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-950/20 space-y-1">
          <span className="text-slate-400 font-mono text-[11px] sm:text-xs uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Surviving</span>
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 font-mono">{stats.treesSurviving}</div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono block truncate">
            Rate: <strong className="text-emerald-300">{stats.survivalRate}%</strong>
          </span>
        </div>

        {/* Available GreenPoints */}
        <div className="p-3.5 sm:p-5 rounded-2xl glass-panel border border-white/10 bg-black/40 space-y-1">
          <span className="text-slate-400 font-mono text-[11px] sm:text-xs uppercase flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">GreenPoints</span>
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">
            {stats.greenPoints.toLocaleString()} <span className="text-xs">GP</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono block truncate">Unlocked & Live</span>
        </div>

        {/* Locked in 30-Day Vesting */}
        <div className="p-3.5 sm:p-5 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/20 space-y-1">
          <span className="text-amber-300 font-mono text-[11px] sm:text-xs uppercase flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">30-Day Escrow</span>
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-400 font-mono">
            {stats.lockedPoints} <span className="text-xs">GP</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono block truncate">Locked in 30-Day</span>
        </div>
      </div>

      {/* ================= PLANTATION PORTFOLIO / 3D BOTANICAL ECOSYSTEM ================= */}
      {realtimeTrees.length === 0 ? (
        /* Empty Portfolio State: Show 3D Botanical Seed & Leaves Morph Interactive Scene */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Digital Botanical Habitat</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  3D Growth Stage: {botanicalStage.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Interactive 3D simulation • Plant your first sapling to begin tracking real-time bio-telemetry
              </p>
            </div>
          </div>

          {/* 3D Botanical Canvas Frame (Mobile Height and Touch Optimization) */}
          <div className="relative w-full h-[320px] sm:h-[450px] rounded-3xl overflow-hidden glass-panel border border-emerald-500/30 shadow-2xl bg-gradient-to-b from-black/80 to-[#031109]/90 touch-pan-y">
            {/* Top Info Badges */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-emerald-500/30 text-[10px] sm:text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>3D SIMULATOR • ROTATE 360°</span>
            </div>

            <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/20 text-[10px] font-mono text-slate-400">
              <span>CELLULAR VEIN & PHOTOSYNTHESIS GRAPH</span>
            </div>

            {/* 3D Canvas */}
            <CanvasWrapper camera={{ position: [0, 0, 4.2], fov: 45 }}>
              <HeroLeafScene stage={botanicalStage} enableControls={true} />
            </CanvasWrapper>

            {/* Morph Stage Switcher */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-full bg-black/85 border border-emerald-500/40 backdrop-blur-xl shadow-2xl max-w-[95%] overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono text-emerald-400/80 px-2 uppercase tracking-wider hidden md:inline">
                GROWTH STAGE:
              </span>
              {[
                { id: 'seed', label: '🌱 Seed', name: 'Seed' },
                { id: 'sprout', label: '🌿 Sprout', name: 'Sprout' },
                { id: 'leaf', label: '🍃 Leaf', name: 'Leaf' },
                { id: 'tree', label: '🌳 Tree', name: 'Tree' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    soundManager.playLeafHover();
                    setBotanicalStage(st.id as GrowthStage);
                  }}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    botanicalStage === st.id
                      ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-emerald-950/40'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt to Plant Tree & Choose Species */}
          <div className="p-5 sm:p-8 rounded-3xl glass-panel border border-emerald-500/20 bg-[#06140c]/70 text-center space-y-4">
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Ready to Plant Your First Tree?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-mono">
                Select from native species like <strong className="text-emerald-400">Neem, Banyan, Teak, Hollong, Sal, Mahua</strong>, capture 3-layer photos, and earn GreenPoints.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleStartPlanting}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs font-mono inline-flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-105"
              >
                <Sprout className="w-4 h-4" />
                <span>+ Select Tree & Plant Now</span>
              </button>

              <button
                onClick={handleStartPlanting}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs font-mono inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>📸 Capture Photographic Proof</span>
              </button>
            </div>

            {!currentUser && (
              <p className="text-[11px] text-amber-300/80 font-mono flex items-center justify-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Sign in is mandatory before submitting verified tree proofs</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Real Living Plantations Portfolio (Only shown when user has planted trees) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>My Living Plantations Portfolio</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {filteredTrees.length} Trees Live
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-time Firestore sync • Click any pending tree to upload its Day 30 survival proof
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {[
                { id: 'all', label: 'All Trees' },
                { id: 'pending', label: '⏳ Day 30 Due' },
                { id: 'verified', label: '✅ Surviving' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedFilter === f.id
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-black/40 border border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tree Cards Grid or Empty State for current filter */}
          {filteredTrees.length === 0 ? (
            <div className="p-10 rounded-3xl glass-panel border border-dashed border-white/15 bg-black/40 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
                🌱
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">No Trees Match "{selectedFilter}"</h3>
              <p className="text-xs text-slate-400 font-mono">Try selecting "All Trees" or plant another sapling.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrees.map((tree, idx) => {
                const isVerified = tree.survivalVerified;
                const isReadyForDay30 = !isVerified && tree.daysAlive >= 30;
                const isMaturing = !isVerified && tree.daysAlive < 30;
                const daysRemaining = Math.max(0, 30 - tree.daysAlive);

                return (
                  <div
                    key={tree.id || tree.code || idx}
                    className="rounded-3xl glass-panel border border-white/10 p-4 bg-black/60 space-y-3.5 hover:border-emerald-500/40 transition-all flex flex-col justify-between group/card"
                  >
                    <div>
                      {/* Photo & Top Actions Bar */}
                      <div className="h-44 rounded-2xl overflow-hidden relative border border-white/10">
                        <img
                          src={
                            tree.growthHistory?.[0]?.imageUrl ||
                            tree.proofPhotos?.layer3Planted ||
                            DEFAULT_TREE_FALLBACK
                          }
                          alt={tree.species}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white">
                          {tree.code}
                        </div>

                        {/* Top Right: Status Badge + Delete Button */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          {isVerified ? (
                            <div className="px-2.5 py-1 rounded-lg bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Surviving</span>
                            </div>
                          ) : isReadyForDay30 ? (
                            <div className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[10px] font-mono font-bold flex items-center gap-1 shadow-lg animate-pulse">
                              <Camera className="w-3 h-3" />
                              <span>Day 30 Ready</span>
                            </div>
                          ) : (
                            <div className="px-2.5 py-1 rounded-lg bg-amber-950/90 backdrop-blur-md border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>Day {tree.daysAlive}/30</span>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiateDelete(tree);
                            }}
                            title="Delete planted tree from dashboard"
                            className="p-1.5 rounded-lg bg-black/80 hover:bg-rose-950/90 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/50 backdrop-blur-md transition-all cursor-pointer shadow-md"
                            aria-label={`Delete ${tree.species} (${tree.code})`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-300 flex items-center justify-between">
                          <span>Planted: {tree.plantedDate}</span>
                          <span>Day {tree.daysAlive} of 30</span>
                        </div>
                      </div>

                      {/* Species & Location Details */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-white">{tree.species}</h3>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {tree.co2AbsorbedKg} kg CO₂
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono italic">
                          {tree.scientificName}
                        </div>
                        <div className="text-xs text-slate-300 flex items-center gap-1 font-mono pt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{tree.locationName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action & Token Status */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Token Vesting:</span>
                        {isVerified ? (
                          <span className="text-emerald-400 font-semibold">🔓 +80 GP Unlocked</span>
                        ) : (
                          <span className="text-amber-400 font-semibold">🔒 30 GP Locked ({daysRemaining}d left)</span>
                        )}
                      </div>

                      {isVerified ? (
                        <button
                          onClick={() => onNavigate('survival')}
                          className="w-full py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 font-semibold text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/30"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verified Surviving (+80 GP)</span>
                        </button>
                      ) : isReadyForDay30 ? (
                        <button
                          onClick={() => {
                            soundManager.playVerifyChime();
                            onNavigate('survival', { code: tree.code });
                          }}
                          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/25"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>📸 Day 30 Ready: Upload Photo (+50 GP)</span>
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            disabled
                            className="w-full py-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 text-amber-300/80 font-semibold text-xs font-mono flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>🔒 Day 30 Locked ({daysRemaining}d remaining)</span>
                          </button>
                          <button
                            onClick={() => {
                              soundManager.playLeafHover();
                              onNavigate('survival', { code: tree.code });
                            }}
                            className="w-full py-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono underline text-center cursor-pointer block"
                          >
                            ⚡ Fast-Forward to Day 30 (Test Mode)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Plantation Confirmation Modal */}
      <AnimatePresence>
        {treeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-3xl glass-panel border border-rose-500/30 bg-[#0c0507]/95 p-6 shadow-2xl shadow-rose-950/50 space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Delete Planted Plant</h3>
                    <p className="text-xs text-rose-300/80 font-mono">Remove tree from dashboard</p>
                  </div>
                </div>
                <button
                  onClick={() => setTreeToDelete(null)}
                  disabled={isDeleting}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tree Details Preview Box */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3.5">
                <img
                  src={
                    treeToDelete.growthHistory?.[0]?.imageUrl ||
                    treeToDelete.proofPhotos?.layer3Planted ||
                    DEFAULT_TREE_FALLBACK
                  }
                  alt={treeToDelete.species}
                  className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="overflow-hidden space-y-0.5 font-mono text-xs">
                  <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                    <span>{treeToDelete.species}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                      {treeToDelete.code}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] truncate">{treeToDelete.locationName}</div>
                  <div className="text-slate-400 text-[10px]">Planted: {treeToDelete.plantedDate}</div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-200/90 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  Are you sure you want to delete this plantation? This will remove its verification record and update your portfolio metrics.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTreeToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Tree</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-[#06140c]/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md flex items-center gap-3 text-white font-mono text-xs"
          >
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="flex-1 text-slate-200">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setUserProfile((prev) => ({
            ...prev,
            name: u.name,
            email: u.email,
            state: u.state || 'Assam',
            district: u.district || 'Kamrup Metropolitan (Guwahati)',
            photoURL: u.photoURL || ''
          }));
        }}
      />
    </div>
  );
}
