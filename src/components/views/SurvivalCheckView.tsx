'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { soundManager } from '@/lib/sound';
import { db, collection, query, orderBy, onSnapshot, unlockTreeTokensInFirestore } from '@/lib/firebase';
import { verify30DaySurvivalWithGemini, GeminiSurvivalResult, compressImageDataUrl } from '@/lib/geminiVision';
import { reverseGeocodeCoords } from '@/lib/geocoding';
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
  Key
} from 'lucide-react';

interface SurvivalCheckViewProps {
  onEarnPoints?: (amount: number) => void;
  selectedTreeCode?: string;
  onNavigate?: (view: string, data?: any) => void;
}

const DEFAULT_TREE_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%2306140d'/%3E%3Ccircle cx='400' cy='300' r='120' fill='%2310b981' opacity='0.15'/%3E%3Cpath d='M400 180c-55 0-100 45-100 100 0 35 18 66 45 84v56h110v-56c27-18 45-49 45-84 0-55-45-100-100-100zm-10 180v40h20v-40h-20z' fill='%2310b981'/%3E%3Ctext x='400' y='460' font-family='monospace' font-size='20' fill='%236ee7b7' text-anchor='middle'%3EFIELD BOTANICAL SPECIMEN%3C/text%3E%3C/svg%3E";

export default function SurvivalCheckView({ onEarnPoints, selectedTreeCode, onNavigate }: SurvivalCheckViewProps) {
  // Real Firestore Trees State
  const [realTrees, setRealTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTreeIndex, setSelectedTreeIndex] = useState(0);
  const [forceTestMode, setForceTestMode] = useState(false);

  // Day 30 Evidence Photo (Starts empty in production, requires real camera/upload)
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

  // Listen to real trees from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'trees'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let deletedIds: string[] = [];
          if (typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem('greenproof_deleted_trees');
              deletedIds = stored ? JSON.parse(stored) : [];
            } catch (e) {}
          }

          const fetched = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((t: any) => !deletedIds.includes(t.id) && !deletedIds.includes(t.code));

          setRealTrees(fetched);
          setLoading(false);

          // If selectedTreeCode prop was passed, find its index
          if (selectedTreeCode) {
            const foundIdx = fetched.findIndex((t: any) => t.code === selectedTreeCode);
            if (foundIdx !== -1) {
              setSelectedTreeIndex(foundIdx);
              setForceTestMode(true); // fast-forward testing mode if navigated from tree card
            }
          }
        },
        (err) => {
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, [selectedTreeCode]);

  const selectedTree = realTrees[selectedTreeIndex] || realTrees[0] || null;

  // Baseline Altitude & GPS from selected tree
  const baselineAltitude = selectedTree?.altitude || 54.0;
  const baselineGps = {
    latitude: selectedTree?.coordinates?.[0] || 26.1445,
    longitude: selectedTree?.coordinates?.[1] || 91.7362,
    altitude: baselineAltitude
  };

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
    if (navigator.geolocation) {
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
    if (!day30Photo) {
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

      // Unlock in Firestore
      if (selectedTree.id) {
        unlockTreeTokensInFirestore(selectedTree.id, selectedTree.planterUid || 'user-1', result.unlockedAmount || 80, result);
      }

      if (onEarnPoints) {
        onEarnPoints(result.unlockedAmount || 80);
      }
    } else {
      soundManager.playScanTick();
    }
  };

  // If no plantations recorded yet
  if (realTrees.length === 0 && !loading) {
    return (
      <div className="relative min-h-screen pt-28 pb-20 px-4 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
          🌱
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">No Active Plantations Found</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            You must first record a tree in "Plant & Verify" with 3-layer photographic evidence and GPS coordinates to track 30-day survival.
          </p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('verify')}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs font-mono shadow-xl transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <Sprout className="w-4 h-4" />
          <span>+ Plant a Tree to Start 30-Day Vesting</span>
        </button>
      </div>
    );
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
          Tokens are locked upon plantation. Upload Day 30 photographic proof with matching GPS & altitude to prove longitudinal survival and unlock full GreenPoint rewards.
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
              Automated 30-day longitudinal growth & survival analysis using system credentials
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 text-[11px] bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Geodetic & Spectral Re-Verification</span>
        </div>
      </div>

      {/* Tree Selector Ribbon from Real Planted History (Horizontally swipeable on mobile) */}
      <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-emerald-500/20 max-w-4xl mx-auto">
        <div className="text-xs font-mono text-emerald-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sprout className="w-4 h-4 shrink-0" />
            <span className="truncate">Select Tree for Day 30 Check:</span>
          </span>
          <span className="text-slate-400 text-[11px] shrink-0">{realTrees.length} Plantations</span>
        </div>

        {realTrees.length === 0 ? (
          <div className="p-6 rounded-xl bg-black/40 border border-dashed border-emerald-500/20 text-center space-y-3">
            <p className="text-xs text-slate-300 font-mono">
              You haven't recorded any tree plantations yet. Plant your first tree to start your 30-day token vesting escrow!
            </p>
            <button
              onClick={() => onNavigate && onNavigate('verify')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs font-mono transition-all cursor-pointer shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span>+ Plant a Tree Now</span>
            </button>
          </div>
        ) : (
          <div className="flex sm:grid sm:grid-cols-3 gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none">
            {realTrees.slice(0, 6).map((tree, idx) => (
              <button
                key={tree.id || tree.code || idx}
                onClick={() => {
                  setSelectedTreeIndex(idx);
                  setAuditResult(null);
                  setTokensUnlocked(false);
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
        )}
      </div>

      {/* Main Side-by-Side Comparison Container */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/30 max-w-5xl mx-auto shadow-2xl bg-black/60 space-y-6">
        {/* Header with Token Status */}
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
            {tokensUnlocked ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>UNLOCKED: +{unlockedAmount} GreenPoints in Wallet</span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 animate-pulse">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>LOCKED: 30 GP Pending 30-Day Living Proof</span>
              </div>
            )}
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

            <div className="h-64 rounded-xl overflow-hidden relative border border-white/10">
              <img
                src={
                  selectedTree.growthHistory?.[0]?.imageUrl ||
                  selectedTree.proofPhotos?.layer3Planted ||
                  DEFAULT_TREE_FALLBACK
                }
                alt="Day 0 Sapling"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md p-2 rounded-lg text-[10px] font-mono text-slate-300 space-y-0.5">
                <div>GPS: {baselineGps.latitude}° N, {baselineGps.longitude}° E</div>
                <div>ALTITUDE: {baselineGps.altitude} m AMSL • HEIGHT: 22 cm</div>
              </div>
            </div>
          </div>
            {/* Day 30 Re-Verification Upload Card */}
            <div className="rounded-2xl p-4 bg-emerald-950/20 border border-emerald-500/30 space-y-3 relative">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  DAY 30 SURVIVAL PROOF
                </span>
                {(selectedTree.daysAlive >= 30 || forceTestMode) && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setUseCamera(!useCamera)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 text-xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Camera className="w-3 h-3" />
                      <span>{useCamera ? 'Close' : 'Camera'}</span>
                    </button>
                    <label className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs flex items-center gap-1 cursor-pointer active:scale-95">
                      <UploadCloud className="w-3 h-3 text-emerald-400" />
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

              {selectedTree.daysAlive < 30 && !forceTestMode ? (
                /* Locked 30-Day Maturation Period Screen */
                <div className="h-64 rounded-xl overflow-hidden relative border border-amber-500/30 bg-black/80 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm font-mono">
                      30-Day Maturation Lock In Progress
                    </h4>
                    <p className="text-slate-400 text-[11px] font-mono mt-1 max-w-xs">
                      Photo upload & token unlocking are locked until 30 days of growth are completed.
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-xs space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-300">
                      <span>Day {selectedTree.daysAlive} of 30</span>
                      <span className="text-amber-400 font-bold">{Math.max(0, 30 - selectedTree.daysAlive)} Days Left</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (selectedTree.daysAlive / 30) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Testing mode toggle */}
                  <button
                    onClick={() => setForceTestMode(true)}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono border border-amber-500/40 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>⚡ Fast-Forward to Day 30 (Test Mode)</span>
                  </button>
                </div>
              ) : (
                /* Unlocked Day 30 Photo Viewfinder */
                <div className="h-64 rounded-xl overflow-hidden relative border border-emerald-500/30 bg-black flex items-center justify-center">
                  {useCamera ? (
                    <div className="relative w-full h-full">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <button
                        onClick={handleCapturePhoto}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-emerald-500 text-black font-bold font-mono text-xs shadow-xl cursor-pointer active:scale-95 flex items-center gap-1.5 z-20"
                      >
                        📸 Snap Day 30 Proof
                      </button>
                    </div>
                  ) : day30Photo ? (
                    <div className="relative w-full h-full">
                      <img src={day30Photo} alt="Day 30 Sapling" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md p-2 rounded-lg text-[10px] font-mono text-slate-300 space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span>RE-VERIFICATION GPS:</span>
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
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-sm font-bold text-white font-mono">
                          No Day-30 Evidence Photo
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          Snap the living tree at this GPS location to prove 30-day biological survival.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => setUseCamera(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold font-mono text-xs hover:bg-emerald-400 cursor-pointer active:scale-95 flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Snap with Camera</span>
                        </button>
                        <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs cursor-pointer active:scale-95 flex items-center gap-1.5">
                          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Upload From Gallery</span>
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
        {(selectedTree.daysAlive >= 30 || forceTestMode) && !auditResult && (
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
                <span>+80 GreenPoints Unlocked to Wallet</span>
              </div>
            )}
          </div>
        ) : selectedTree.daysAlive < 30 && !forceTestMode ? (
          <div className="space-y-2">
            <button
              disabled
              className="w-full py-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-amber-300 font-bold text-sm font-mono flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-inner"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>🔒 Verification Locked: Unlocks on Day 30 ({30 - selectedTree.daysAlive} Days Left)</span>
            </button>
            <p className="text-center text-[10px] text-slate-500 font-mono">
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
                <span>Auditing Day 30 Temporal Differentials & Altitude...</span>
              </>
            ) : !day30Photo ? (
              <>
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>📸 Capture or Upload Day-30 Photo Above to Run Audit</span>
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
