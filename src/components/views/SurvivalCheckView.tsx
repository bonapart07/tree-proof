'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { soundManager } from '@/lib/sound';
import { db, collection, query, orderBy, onSnapshot, unlockTreeTokensInFirestore } from '@/lib/firebase';
import { getLocalTrees, mergeTreesWithLocal, updateLocalTree, StoredTree } from '@/lib/treeStorage';
import { verify30DaySurvivalWithGemini, GeminiSurvivalResult, compressImageDataUrl } from '@/lib/geminiVision';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
  Camera,
  UploadCloud,
  Lock,
  Unlock,
  MapPin,
  Compass,
  AlertTriangle,
  RefreshCw,
  Award,
  Sprout,
  Clock,
  ChevronDown,
  Check
} from 'lucide-react';

interface SurvivalCheckViewProps {
  onEarnPoints?: (amount: number) => void;
  selectedTreeCode?: string;
  onNavigate?: (view: string, data?: any) => void;
}

const DEFAULT_TREE_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%2306140d'/%3E%3Ccircle cx='400' cy='300' r='120' fill='%2310b981' opacity='0.15'/%3E%3Cpath d='M400 180c-55 0-100 45-100 100 0 35 18 66 45 84v56h110v-56c27-18 45-49 45-84 0-55-45-100-100-100zm-10 180v40h20v-40h-20z' fill='%2310b981'/%3E%3Ctext x='400' y='460' font-family='monospace' font-size='20' fill='%236ee7b7' text-anchor='middle'%3EFIELD BOTANICAL SPECIMEN%3C/text%3E%3C/svg%3E";

export default function SurvivalCheckView({ onEarnPoints, selectedTreeCode, onNavigate }: SurvivalCheckViewProps) {
  // Real Local & Firestore Trees State
  const [realTrees, setRealTrees] = useState<StoredTree[]>(() => {
    if (typeof window !== 'undefined') {
      return getLocalTrees();
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [selectedTreeIndex, setSelectedTreeIndex] = useState(0);
  const [forceTestMode, setForceTestMode] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Day 30 Evidence Photo
  const [day30Photo, setDay30Photo] = useState<string>('');
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Gemini Vision Verification State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<GeminiSurvivalResult | null>(null);
  const [tokensUnlocked, setTokensUnlocked] = useState(false);
  const [unlockedAmount, setUnlockedAmount] = useState(0);

  // Real-time device GPS state
  const [currentGps, setCurrentGps] = useState({
    latitude: 26.1445,
    longitude: 91.7362,
    accuracy: 3.5,
    altitude: 54.0,
    timestamp: new Date().toLocaleString()
  });
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Live 1-second ticking clock for real-time 30-day countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to both local storage updates and Firestore
  useEffect(() => {
    // 1. Initial load from local storage
    const local = getLocalTrees();
    if (local.length > 0) {
      setRealTrees(local);
    }

    // 2. Custom event listener for instant updates from Plant & Verify
    const handleTreesUpdated = () => {
      const updated = getLocalTrees();
      setRealTrees(mergeTreesWithLocal(updated));
    };
    window.addEventListener('greenproof_trees_updated', handleTreesUpdated);

    // 3. Firestore live subscription
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'trees'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let firestoreList: any[] = [];
          if (!snapshot.empty) {
            firestoreList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          }
          const merged = mergeTreesWithLocal(firestoreList);
          setRealTrees(merged);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('greenproof_trees_updated', handleTreesUpdated);
      unsubscribe();
    };
  }, []);

  // Sync selectedTreeIndex when selectedTreeCode prop changes or trees change
  useEffect(() => {
    if (selectedTreeCode && realTrees.length > 0) {
      const foundIdx = realTrees.findIndex((t) => t.code === selectedTreeCode);
      if (foundIdx !== -1) {
        setSelectedTreeIndex(foundIdx);
      }
    }
  }, [selectedTreeCode, realTrees]);

  const selectedTree: StoredTree | null =
    realTrees[selectedTreeIndex] || (realTrees.length > 0 ? realTrees[0] : null);

  // Baseline Altitude & GPS from selected tree
  const baselineAltitude = selectedTree?.altitude || 54.0;
  const baselineGps = {
    latitude: selectedTree?.coordinates?.[0] || 26.1445,
    longitude: selectedTree?.coordinates?.[1] || 91.7362,
    altitude: baselineAltitude
  };

  // 30 Days in Milliseconds: 30 * 24 * 60 * 60 * 1000 = 2,592,000,000 ms
  const VESTING_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
  const plantedTimestamp =
    selectedTree?.plantedAt ||
    (selectedTree?.plantedDate ? new Date(selectedTree.plantedDate).getTime() : currentTime);
  const targetUnlockTimestamp = plantedTimestamp + VESTING_DURATION_MS;
  const remainingMs = Math.max(0, targetUnlockTimestamp - currentTime);

  const daysLeft = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const elapsedMs = Math.max(0, currentTime - plantedTimestamp);
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / VESTING_DURATION_MS) * 100));

  const isCountdownOver = remainingMs === 0;
  const isCaptureUnlocked = isCountdownOver || forceTestMode || Boolean(selectedTree?.survivalVerified);

  // Real-time live mathematical delta calculation
  const dLat = (currentGps.latitude - baselineGps.latitude) * 111320;
  const dLng =
    (currentGps.longitude - baselineGps.longitude) *
    111320 *
    Math.cos((baselineGps.latitude * Math.PI) / 180);
  const liveDistanceMeters = Math.sqrt(dLat * dLat + dLng * dLng);
  const liveAltitudeDelta = Math.abs(currentGps.altitude - baselineAltitude);

  // Auto-acquire real browser GPS on load / tree selection
  useEffect(() => {
    handleRefreshGps();
  }, [selectedTreeIndex]);

  // Live Camera trigger
  useEffect(() => {
    if (useCamera && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => setUseCamera(false));
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useCamera]);

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setDay30Photo(canvas.toDataURL('image/jpeg', 0.75));
        setUseCamera(false);
        soundManager.playLeafHover();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const raw = ev.target.result as string;
          const compressed = await compressImageDataUrl(raw, 640, 0.75);
          setDay30Photo(compressed);
          soundManager.playLeafHover();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefreshGps = () => {
    setIsGpsLoading(true);
    soundManager.playScanTick();
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
            accuracy: Number(pos.coords.accuracy.toFixed(1)),
            altitude: pos.coords.altitude ? Number(pos.coords.altitude.toFixed(1)) : 54.0,
            timestamp: new Date().toLocaleString()
          });
          setIsGpsLoading(false);
          soundManager.playVerifyChime();
        },
        () => {
          setIsGpsLoading(false);
          soundManager.playVerifyChime();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsGpsLoading(false);
    }
  };

  const handleExecuteSurvivalAudit = async () => {
    if (!day30Photo || !selectedTree) {
      soundManager.playScanTick();
      return;
    }
    setIsAuditing(true);
    soundManager.playScanTick();

    const baselinePhoto =
      selectedTree.growthHistory?.[0]?.imageUrl ||
      selectedTree.proofPhotos?.layer3Planted ||
      selectedTree.proofPhotos?.layer1Soil ||
      DEFAULT_TREE_FALLBACK;

    const result = await verify30DaySurvivalWithGemini({
      treeCode: selectedTree.code,
      speciesName: selectedTree.species,
      day0BaselinePhoto: baselinePhoto,
      day30NewPhoto: day30Photo,
      baselineGps: baselineGps,
      currentGps: {
        latitude: currentGps.latitude,
        longitude: currentGps.longitude,
        altitude: currentGps.altitude
      }
    });

    setAuditResult(result);
    setIsAuditing(false);

    if (result.tokensUnlocked) {
      setTokensUnlocked(true);
      setUnlockedAmount(result.unlockedAmount || 80);
      soundManager.playRewardBurst();
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#3b82f6', '#ec4899']
      });

      // Update local storage tree
      updateLocalTree(selectedTree.code, {
        survivalVerified: true,
        status: 'healthy',
        unlockedTokens: result.unlockedAmount || 80,
        lockedTokens: 0,
        growthHistory: [
          ...(selectedTree.growthHistory || []),
          {
            day: 30,
            imageUrl: day30Photo,
            note: 'Day 30 Survival Verification'
          }
        ]
      });

      // Unlock in Firestore
      if (selectedTree.id) {
        unlockTreeTokensInFirestore(
          selectedTree.id,
          selectedTree.planterUid || 'planter-steward',
          result.unlockedAmount || 80,
          result
        );
      }

      if (onEarnPoints) {
        onEarnPoints(result.unlockedAmount || 80);
      }
    } else {
      soundManager.playScanTick();
    }
  };

  // Safe Guard: If no plantations recorded yet
  if (realTrees.length === 0) {
    return (
      <div className="relative min-h-screen pt-28 pb-20 px-4 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/10">
          🌱
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>30-DAY VESTING ESCROW</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">No Registered Trees Found</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed">
            You must first record a tree in "Plant New Tree" with 3-layer photographic evidence and GPS locking. Your 30-day survival countdown and token vesting will then begin automatically.
          </p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('verify')}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs font-mono shadow-xl transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <Sprout className="w-4 h-4" />
          <span>+ Plant Your First Tree to Start Vesting</span>
        </button>
      </div>
    );
  }

  // Guaranteed non-null selectedTree
  if (!selectedTree) {
    return null;
  }

  return (
    <div className="relative min-h-screen pt-16 sm:pt-28 pb-20 px-3 sm:px-4 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-3">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>DAY 30 SURVIVAL VERIFICATION & TOKEN VESTING</span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Verify Tree Survival & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-mint">Unlock Tokens</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 font-mono max-w-2xl mx-auto">
          Tokens are locked upon plantation. After the 30-day biological growth countdown, submit matching photographic proof and GPS fix to prove survival and unlock full GreenPoint rewards.
        </p>
      </div>

      {/* Real-Time Google Gemini Vision Engine Active Status */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-emerald-500/30 max-w-4xl mx-auto font-mono text-xs flex flex-wrap items-center justify-between gap-3 bg-black/60 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-2.5 text-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Google Gemini 3.1 Vision Neural Engine</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Real-Time AI Active</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Automated 30-day longitudinal growth & survival analysis with geodetic re-verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 text-[11px] bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Geodetic & Spectral Re-Verification</span>
        </div>
      </div>

      {/* Registered Trees Selector Ribbon & Dropdown */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-emerald-500/25 max-w-5xl mx-auto bg-black/60 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">REGISTERED SPECIMEN SELECTOR:</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Specimen <span className="text-emerald-400 font-bold">{selectedTreeIndex + 1}</span> of {realTrees.length} Registered Trees
          </div>
        </div>

        {/* Dropdown for All Registered Trees */}
        <div className="relative">
          <select
            value={selectedTreeIndex}
            onChange={(e) => {
              setSelectedTreeIndex(Number(e.target.value));
              setAuditResult(null);
              setTokensUnlocked(false);
              setDay30Photo('');
              setForceTestMode(false);
              soundManager.playLeafHover();
            }}
            className="w-full px-4 py-3 rounded-xl bg-black/80 border border-emerald-500/40 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 cursor-pointer appearance-none shadow-inner"
          >
            {realTrees.map((tree, idx) => (
              <option key={tree.code || idx} value={idx} className="bg-slate-900 text-white">
                [{tree.code}] {tree.species} • Planted: {tree.plantedDate} • {tree.survivalVerified ? '✅ Surviving (Unlocked)' : '🔒 30d Vesting Locked'}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Quick-Switch Visual Cards (Horizontally swipeable on mobile) */}
        <div className="flex sm:grid sm:grid-cols-3 gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none pt-1">
          {realTrees.slice(0, 6).map((tree, idx) => (
            <button
              key={tree.id || tree.code || idx}
              onClick={() => {
                setSelectedTreeIndex(idx);
                setAuditResult(null);
                setTokensUnlocked(false);
                setDay30Photo('');
                setForceTestMode(false);
                soundManager.playLeafHover();
              }}
              className={`min-w-[240px] sm:min-w-0 p-3 rounded-xl border text-left font-mono transition-all cursor-pointer shrink-0 sm:shrink active:scale-[0.98] ${
                selectedTreeIndex === idx
                  ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/30 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-400">{tree.code}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {tree.survivalVerified ? '✅ Surviving' : '🔒 30 GP Locked'}
                </span>
              </div>
              <div className="text-xs font-semibold text-white mt-1 truncate">{tree.species}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{tree.locationName}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main 30-Day Maturation & Verification Container */}
      <div className="p-5 sm:p-8 rounded-3xl glass-panel border border-emerald-500/30 max-w-5xl mx-auto shadow-2xl bg-black/60 space-y-6">
        {/* Header with Tree Details and Token Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-500/20 gap-3">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase">SUBJECT TREE SPECIMEN:</span>
            <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <span>{selectedTree.code}</span>
              <span className="text-xs text-slate-400 font-sans">({selectedTree.species} • {selectedTree.scientificName})</span>
            </h3>
          </div>

          {/* Token Vesting Status Badge */}
          <div className="flex items-center gap-2">
            {tokensUnlocked || selectedTree.survivalVerified ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>UNLOCKED: +{selectedTree.unlockedTokens || unlockedAmount || 80} GreenPoints in Wallet</span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 animate-pulse">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>LOCKED: 30 GP Staked in 30-Day Escrow</span>
              </div>
            )}
          </div>
        </div>

        {/* 30-Day Maturation Live Countdown HUD */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/70 border border-emerald-500/30 font-mono space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-bold text-white">30-DAY BIOLOGICAL MATURATION COUNTDOWN</span>
            </div>
            <div className="flex items-center gap-2">
              {isCaptureUnlocked ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Maturation Period Complete • Capture Unlocked</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Vesting Active • Capture Locked</span>
                </span>
              )}
            </div>
          </div>

          {/* 4-Box Digital Clock Display */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 shadow-inner">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">{daysLeft}</div>
              <div className="text-[10px] text-slate-400 uppercase font-sans mt-0.5 tracking-wider font-semibold">Days Left</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 shadow-inner">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">{String(hoursLeft).padStart(2, '0')}</div>
              <div className="text-[10px] text-slate-400 uppercase font-sans mt-0.5 tracking-wider font-semibold">Hours</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 shadow-inner">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">{String(minutesLeft).padStart(2, '0')}</div>
              <div className="text-[10px] text-slate-400 uppercase font-sans mt-0.5 tracking-wider font-semibold">Minutes</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 shadow-inner">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">{String(secondsLeft).padStart(2, '0')}</div>
              <div className="text-[10px] text-slate-400 uppercase font-sans mt-0.5 tracking-wider font-semibold">Seconds</div>
            </div>
          </div>

          {/* Progress Bar with Percentage and Elapsed Days */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-slate-300 font-mono">
              <span>Growth Maturation: Day {Math.min(30, Math.floor(elapsedMs / 86400000) + 1)} of 30</span>
              <span className="text-emerald-400 font-bold">{progressPercent.toFixed(1)}% Vested</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Side-by-Side Photo Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Day 0 Baseline Card */}
          <div className="rounded-2xl p-4 bg-black/50 border border-white/10 space-y-3">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-white/10">
                DAY 0 BASELINE PHOTO
              </span>
              <span className="text-slate-400 text-[11px]">{selectedTree.plantedDate}</span>
            </div>

            <div className="h-72 rounded-xl overflow-hidden relative border border-white/10">
              <img
                src={
                  selectedTree.growthHistory?.[0]?.imageUrl ||
                  selectedTree.proofPhotos?.layer3Planted ||
                  selectedTree.proofPhotos?.layer1Soil ||
                  DEFAULT_TREE_FALLBACK
                }
                alt="Day 0 Sapling"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md p-2 rounded-lg text-[10px] font-mono text-slate-300 space-y-0.5 border border-white/10">
                <div>GPS: {baselineGps.latitude}° N, {baselineGps.longitude}° E</div>
                <div>ALTITUDE: {baselineGps.altitude} m AMSL • INITIAL SAPLING</div>
              </div>
            </div>
          </div>

          {/* Day 30 Re-Verification Upload Card */}
          <div className="rounded-2xl p-4 bg-emerald-950/20 border border-emerald-500/30 space-y-3 relative">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                {isCaptureUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                <span>DAY 30 SURVIVAL PROOF</span>
              </span>

              {/* Capture & Upload buttons are active ONLY when isCaptureUnlocked is true */}
              {isCaptureUnlocked && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setUseCamera(!useCamera)}
                    className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 font-mono"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{useCamera ? 'Close Camera' : '📸 Camera'}</span>
                  </button>
                  <label className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 font-mono">
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}
            </div>

            {!isCaptureUnlocked ? (
              /* LOCKED VIEW: Maturation Period In Progress */
              <div className="h-72 rounded-xl overflow-hidden relative border border-amber-500/40 bg-black/85 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl animate-pulse">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm font-mono flex items-center justify-center gap-1.5">
                    <span>Camera & Upload Locked</span>
                  </h4>
                  <p className="text-slate-300 text-xs font-mono mt-1 max-w-sm leading-relaxed">
                    Photo capture unlocks automatically when the 30-day countdown reaches zero ({daysLeft}d {hoursLeft}h {minutesLeft}m {secondsLeft}s remaining).
                  </p>
                </div>

                {/* Simulator / Fast-Forward Testing Button */}
                <button
                  onClick={() => {
                    setForceTestMode(true);
                    soundManager.playRewardBurst();
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono border border-amber-500/40 cursor-pointer flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/10"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ Unlock Day 30 Now (Fast-Forward Test Mode)</span>
                </button>
              </div>
            ) : (
              /* UNLOCKED VIEW: Camera / Upload / Preview */
              <div className="h-72 rounded-xl overflow-hidden relative border border-emerald-500/30 bg-black flex items-center justify-center">
                {useCamera ? (
                  <div className="relative w-full h-full">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <button
                      onClick={handleCapturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold font-mono text-xs shadow-2xl cursor-pointer active:scale-95 flex items-center gap-2 z-20"
                    >
                      📸 Snap Day 30 Proof
                    </button>
                  </div>
                ) : day30Photo ? (
                  <div className="relative w-full h-full">
                    <img src={day30Photo} alt="Day 30 Specimen" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-md p-2 rounded-lg text-[10px] font-mono text-slate-300 space-y-0.5 border border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold">RE-VERIFICATION GPS FIX:</span>
                        <button
                          onClick={handleRefreshGps}
                          disabled={isGpsLoading}
                          className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
                          <span>{isGpsLoading ? 'Syncing...' : 'Sync GPS'}</span>
                        </button>
                      </div>
                      <div>
                        {currentGps.latitude.toFixed(6)}° N, {currentGps.longitude.toFixed(6)}° E (±{currentGps.accuracy}m)
                      </div>
                      <div>ALTITUDE: {currentGps.altitude} m AMSL</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-sm font-bold text-white font-mono">
                        Day 30 Capture Unlocked
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Snap the living tree at this location using camera or upload to run real-time AI survival audit.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => setUseCamera(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold font-mono text-xs hover:bg-emerald-400 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Snap with Camera</span>
                      </button>
                      <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs cursor-pointer active:scale-95 flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Upload from Gallery</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Geodetic Telemetry & Delta Matching Radar */}
        {isCaptureUnlocked && !auditResult && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-2">
            <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>REAL-TIME DUAL-SENSOR GEODETIC TELEMETRY</span>
              </span>
              <span className="text-[10px] text-slate-400">Tolerance: &lt; 20m GPS • &lt; 15m Altitude</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>GPS DISTANCE DELTA:</span>
                  <span className={liveDistanceMeters <= 20 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {liveDistanceMeters <= 20 ? '✅ MATCHED (Within ±20m)' : '⚠️ OUT OF RANGE'}
                  </span>
                </div>
                <div className="text-base font-bold text-white font-mono">
                  Δ {liveDistanceMeters.toFixed(1)} meters
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>ALTITUDE AMSL DELTA:</span>
                  <span className={liveAltitudeDelta <= 15 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {liveAltitudeDelta <= 15 ? '✅ MATCHED (Within ±15m)' : '⚠️ OUT OF RANGE'}
                  </span>
                </div>
                <div className="text-base font-bold text-white font-mono">
                  Δ {liveAltitudeDelta.toFixed(1)} meters AMSL
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Results or CTA */}
        {auditResult ? (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-emerald-400 font-bold text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>GEMINI AI SURVIVAL AUDIT: VERIFIED LIVING SPECIMEN</span>
              </span>
              <span>CONFIDENCE: {auditResult.sameSpecimenConfidence}%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[9px] block">GROWTH DETECTED:</span>
                <span className="text-emerald-300 font-bold">+{auditResult.growthRatePct}% Biomass</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[9px] block">HEALTH SCORE:</span>
                <span className="text-emerald-300 font-bold">{auditResult.healthScore} / 100</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[9px] block">GPS DISTANCE DELTA:</span>
                <span className="text-emerald-300 font-bold">{auditResult.gpsDistanceMeters} m (Passed)</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[9px] block">ALTITUDE DELTA:</span>
                <span className="text-emerald-300 font-bold">{auditResult.altitudeDeltaMeters} m (Passed)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
              {auditResult.reasoning}
            </p>

            {tokensUnlocked && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-between font-bold">
                <span>🎉 Day 30 Survival Milestone Achieved!</span>
                <span>+{unlockedAmount} GreenPoints Unlocked to Wallet</span>
              </div>
            )}
          </div>
        ) : !isCaptureUnlocked ? (
          <div className="space-y-2">
            <button
              disabled
              className="w-full py-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-amber-300 font-bold text-sm font-mono flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-inner"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>🔒 Survival Audit Locked: Unlocks in {daysLeft}d {hoursLeft}h {minutesLeft}m {secondsLeft}s</span>
            </button>
            <p className="text-center text-[10px] text-slate-400 font-mono">
              Biological maturation protocol: Survival verification opens strictly after 30 full days from planting date.
            </p>
          </div>
        ) : (
          <button
            onClick={handleExecuteSurvivalAudit}
            disabled={isAuditing || !day30Photo}
            className={`w-full py-4 rounded-2xl font-extrabold text-sm font-mono shadow-xl transition-all flex items-center justify-center gap-2 ${
              !day30Photo
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/35 cursor-pointer'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-emerald-500/25 cursor-pointer hover:scale-[1.01]'
            }`}
          >
            {isAuditing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Auditing Day 30 Temporal Differentials & Growth with Gemini AI...</span>
              </>
            ) : !day30Photo ? (
              <>
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>📸 Capture or Upload Day-30 Photo Above to Run Survival Audit</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Gemini Vision Survival Audit & Unlock +80 GP</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
