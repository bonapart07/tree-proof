'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar, { NavTab } from '@/components/ui/Navbar';
import PlanterLoginView from '@/components/views/PlanterLoginView';
import PlantVerifyView from '@/components/views/PlantVerifyView';
import UserDashboardView from '@/components/views/UserDashboardView';
import SurvivalCheckView from '@/components/views/SurvivalCheckView';
import CanvasWrapper from '@/components/3d/CanvasWrapper';
import FloatingLeavesBackground from '@/components/3d/FloatingLeavesSystem';
import {
  auth,
  onAuthStateChanged,
  signOut,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
  subscribeToUserDocument
} from '@/lib/firebase';
import { getLocalTrees } from '@/lib/treeStorage';
import { ShieldCheck, Sprout, Lock, RefreshCw } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('greenproof_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.uid || parsed.name)) {
            return parsed;
          }
        } catch (e) {}
      }
      const defaultUser = {
        uid: 'planter-steward',
        name: 'Green Steward',
        email: 'steward@greenproof.eco',
        district: 'Kamrup Metropolitan',
        state: 'Assam',
        role: 'citizen'
      };
      localStorage.setItem('greenproof_user', JSON.stringify(defaultUser));
      return defaultUser;
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('verify');
  const [selectedTreeCode, setSelectedTreeCode] = useState<string>('');
  const [greenPoints, setGreenPoints] = useState<number>(0);
  const [lockedPoints, setLockedPoints] = useState<number>(0);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  // Sync authentication state from Firebase & localStorage
  useEffect(() => {
    // 1. Check local session storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('greenproof_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.uid || parsed.name)) {
            setCurrentUser(parsed);
          }
        } catch (e) {}
      }
    }

    // 2. Real-time Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser((prev: any) => ({
          ...(prev || {}),
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || prev?.name || 'Verified Planter',
          email: firebaseUser.email || prev?.email || '',
          photoURL: firebaseUser.photoURL || prev?.photoURL || ''
        }));
      }
      setAuthLoading(false);
    });

    // Check user preference for reduced motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setIsReducedMotion(true);
      }
    }

    return () => unsubscribe();
  }, []);

  // Real-time Firestore user balance and tree vesting sync
  useEffect(() => {
    if (!currentUser?.uid) {
      setGreenPoints(0);
      setLockedPoints(0);
      return;
    }

    // 1. Live subscription to user profile document for unlocked greenPoints
    const unsubUser = subscribeToUserDocument(currentUser.uid, (userData) => {
      if (userData?.greenPoints !== undefined) {
        setGreenPoints(userData.greenPoints);
      }
    });

    // 2. Live subscription to user's trees to calculate real locked escrow vesting tokens
    let unsubTrees = () => {};
    try {
      const q = query(collection(db, 'trees'), orderBy('createdAt', 'desc'));
      unsubTrees = onSnapshot(q, (snapshot) => {
        let deletedIds: string[] = [];
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('greenproof_deleted_trees');
            deletedIds = stored ? JSON.parse(stored) : [];
          } catch (e) {}
        }

        const myTrees = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((t) => !deletedIds.includes(t.id) && !deletedIds.includes(t.code))
          .filter((t) => !t.planterUid || t.planterUid === currentUser.uid);

        const locked = myTrees
          .filter((t) => !t.survivalVerified)
          .reduce((acc, t) => acc + (t.lockedTokens ?? 30), 0);

        setLockedPoints(locked);
      });
    } catch (err) {
      console.warn('Real-time trees subscription notice:', err);
    }

    return () => {
      unsubUser();
      unsubTrees();
    };
  }, [currentUser?.uid]);

  // Real-time calculation of locked points from local storage trees
  useEffect(() => {
    const updateLocalLocked = () => {
      const trees = getLocalTrees();
      const locked = trees
        .filter((t) => !t.survivalVerified)
        .reduce((acc, t) => acc + (t.lockedTokens ?? 30), 0);
      setLockedPoints((prev) => Math.max(prev, locked));
    };
    updateLocalLocked();
    window.addEventListener('greenproof_trees_updated', updateLocalLocked);
    return () => window.removeEventListener('greenproof_trees_updated', updateLocalLocked);
  }, []);

  const handleEarnPoints = async (amount: number) => {
    setGreenPoints((prev) => prev + amount);
    if (currentUser?.uid) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        const currentTotal = snap.exists() ? (snap.data().greenPoints || 0) : 0;
        await setDoc(
          userRef,
          {
            greenPoints: currentTotal + amount,
            lastEarnedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Could not sync earned points to Firestore:', e);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('greenproof_user');
    }
    setCurrentUser(null);
    setActiveTab('verify');
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setActiveTab('verify');
  };

  const handleNavigateWithData = (view: string, data?: any) => {
    if (data?.code) {
      setSelectedTreeCode(data.code);
    }
    setActiveTab(view as NavTab);
  };

  // Render strictly the 3 plantation options when authenticated
  const renderActiveView = () => {
    if (!currentUser) {
      return <PlanterLoginView onLoginSuccess={handleLoginSuccess} />;
    }

    switch (activeTab) {
      case 'verify':
        return (
          <PlantVerifyView
            onEarnPoints={handleEarnPoints}
            onNavigate={handleNavigateWithData}
            currentUser={currentUser}
          />
        );
      case 'dashboard':
        return (
          <UserDashboardView
            onNavigate={handleNavigateWithData}
          />
        );
      case 'survival':
        return (
          <SurvivalCheckView
            onEarnPoints={handleEarnPoints}
            selectedTreeCode={selectedTreeCode}
            onNavigate={handleNavigateWithData}
          />
        );
      default:
        return (
          <PlantVerifyView
            onEarnPoints={handleEarnPoints}
            onNavigate={handleNavigateWithData}
            currentUser={currentUser}
          />
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#060a08] flex items-center justify-center font-mono text-xs text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>Connecting to GreenProof Real-time Protocol...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#060a08] text-[#f1f5f2] relative flex flex-col justify-between selection:bg-emerald-500 selection:text-black ${isReducedMotion ? 'reduced-motion' : ''}`}>
      {/* Floating 3D Micro-Leaves in Atmospheric Background */}
      {!isReducedMotion && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
          <CanvasWrapper camera={{ position: [0, 0, 8], fov: 50 }}>
            <FloatingLeavesBackground count={5} />
          </CanvasWrapper>
        </div>
      )}

      {/* Floating Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        greenPoints={greenPoints}
        lockedPoints={lockedPoints}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Dynamic View Content with Mobile Bottom Padding */}
      <main className="relative z-10 flex-1 pt-14 sm:pt-16 pb-28 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentUser ? activeTab : 'login'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Comprehensive Footer (Lifted above mobile bottom bar) */}
      <footer className={`relative z-10 border-t border-emerald-500/15 bg-black/40 backdrop-blur-xl py-8 px-4 sm:px-6 mt-8 sm:mt-16 ${currentUser ? 'mb-20 md:mb-0' : ''}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold shrink-0">
              🌿
            </div>
            <span className="text-white font-semibold tracking-wider">GREENPROOF PROTOCOL</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-400 text-[11px]">Hardware GNSS & 30-Day Escrow</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Smart Contract 30-Day Vesting</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-500">Google Gemini Vision Neural Audit</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
