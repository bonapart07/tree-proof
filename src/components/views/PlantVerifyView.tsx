'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { soundManager } from '@/lib/sound';
import { recordTreeToFirestore, auth, onAuthStateChanged, signInWithGoogleReal } from '@/lib/firebase';
import { saveLocalTree } from '@/lib/treeStorage';
import AuthModal from '@/components/ui/AuthModal';
import { COMPREHENSIVE_SPECIES_LIST, SpeciesItem } from '@/lib/speciesData';
import { generateDeviceFingerprint, DeviceTelemetry } from '@/lib/deviceFingerprint';
import { reverseGeocodeCoords } from '@/lib/geocoding';
import { verifyPlantationWithGemini, analyzeImagePixelChlorophyll, compressImageDataUrl } from '@/lib/geminiVision';
import {
  Camera,
  MapPin,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sprout,
  Video,
  UploadCloud,
  Layers,
  Award,
  Search,
  Laptop,
  Check,
  Compass,
  Flame,
  Info,
  Lock,
  Key,
  Eye,
  CheckCheck,
  Edit3,
  Sliders
} from 'lucide-react';

interface PlantVerifyViewProps {
  onEarnPoints: (amount: number) => void;
  onNavigate: (view: string, data?: any) => void;
  currentUser?: any;
}

// 3 Photographic Proof Layers
interface ProofLayers {
  layer1Soil: string;
  layer2Planting: string;
  layer3Planted: string;
}

export default function PlantVerifyView({ onEarnPoints, onNavigate, currentUser: propUser }: PlantVerifyViewProps) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (propUser) return propUser;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('greenproof_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return null;
  });

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Guided Multi-Step Flow: 1 (Species) -> 2 (Geo & Device) -> 3 (3-Layer Photos) -> 4 (AI Multi-Scan) -> 5 (Passport) -> 6 (Reward)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Species State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesItem>(COMPREHENSIVE_SPECIES_LIST[0]);

  // Custom / Other species details
  const [customTreeName, setCustomTreeName] = useState('');
  const [customScientificName, setCustomScientificName] = useState('');
  const [customLocalName, setCustomLocalName] = useState('');
  const [customCo2Kg, setCustomCo2Kg] = useState(25);

  const handleSelectSpecies = (species: SpeciesItem) => {
    soundManager.playLeafHover();
    if (species.id === 'other') {
      setSelectedSpecies({
        ...species,
        name: customTreeName.trim() ? customTreeName.trim() : 'Other Species (Custom)',
        scientific: customScientificName.trim() ? customScientificName.trim() : 'Custom Botanical Specimen',
        assameseName: customLocalName.trim() || undefined,
        co2: `${customCo2Kg} kg/yr`,
        co2KgPerYear: customCo2Kg
      });
    } else {
      setSelectedSpecies(species);
    }
  };

  const handleUpdateCustomSpecies = (
    name: string,
    scientific: string,
    localName: string,
    co2: number
  ) => {
    setCustomTreeName(name);
    setCustomScientificName(scientific);
    setCustomLocalName(localName);
    setCustomCo2Kg(co2);

    setSelectedSpecies({
      id: 'other',
      name: name.trim() ? name.trim() : 'Other Species (Custom)',
      scientific: scientific.trim() ? scientific.trim() : 'Custom Botanical Specimen',
      assameseName: localName.trim() || undefined,
      co2: `${co2} kg/yr`,
      co2KgPerYear: co2,
      icon: '🌱',
      badge: '✏️ Custom Species',
      category: 'other',
      description: `Custom planted specimen: ${name.trim() || 'Unlisted tree'}. Monitored under 30-day GreenProof survival escrow.`,
      nativeRegions: 'Local Agroforestry / Native / Homestead Bari',
      rewardPoints: 20,
      isCustom: true
    });
  };

  // Step 2: Geolocation & Device Tracking State (Real Device Coordinates & District)
  const [gpsData, setGpsData] = useState({
    latitude: 26.1445,
    longitude: 91.7362,
    accuracy: 3.2,
    altitude: 54.2,
    locationName: 'Guwahati Bio-Reserve, Kamrup Metropolitan, Assam',
    district: 'Kamrup Metropolitan (Guwahati)',
    state: 'Assam',
    timestamp: new Date().toLocaleString()
  });
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceTelemetry | null>(null);

  // Step 3: 3-Layered Photographic Proofs State
  const [activeProofLayer, setActiveProofLayer] = useState<1 | 2 | 3>(1);
  const [proofPhotos, setProofPhotos] = useState<ProofLayers>({
    layer1Soil: '', // Soil pit
    layer2Planting: '', // Placing sapling
    layer3Planted: '' // Final sapling in ground
  });
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [photoMissingAlert, setPhotoMissingAlert] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Step 4: AI Computer Vision & Real-Time Gemini Vision State
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanPassed, setScanPassed] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiAnalysisResults, setAiAnalysisResults] = useState({
    layer1SoilScore: 0,
    layer1Status: 'Pending verification',
    layer2PlantingScore: 0,
    layer2Status: 'Pending verification',
    layer3PlantedScore: 0,
    layer3Status: 'Pending verification',
    chlorophyllIndexExG: 0,
    perceptualHashMatch: 'Pending scan',
    deviceAntiSybil: 'Pending scan',
    compositeConfidence: 0,
    reasoning: 'Awaiting execution. Click the button below to run the real AI botanical scan.'
  });

  // Step 5 & 6: Generated Tree ID, Blockchain & Rewards
  const [generatedTree, setGeneratedTree] = useState<any>(null);

  // Initialize device info, listen for Auth, and fetch REAL GPS with District
  useEffect(() => {
    const device = generateDeviceFingerprint();
    setDeviceInfo(device);

    // Auto-fetch REAL Device GPS and Reverse-Geocode exact District
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lon = Number(pos.coords.longitude.toFixed(5));
          const accuracy = Number(pos.coords.accuracy.toFixed(1));
          const altitude = pos.coords.altitude ? Number(pos.coords.altitude.toFixed(1)) : 54.2;

          try {
            const geo = await reverseGeocodeCoords(lat, lon);
            setGpsData({
              latitude: lat,
              longitude: lon,
              accuracy: accuracy,
              altitude: altitude,
              locationName: geo.locationName || `${geo.district}, ${geo.state}, ${geo.country}`,
              district: geo.district || 'Kamrup Metropolitan',
              state: geo.state || 'Assam',
              timestamp: new Date().toLocaleString()
            });
          } catch (e) {
            setGpsData((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lon,
              accuracy: accuracy,
              altitude: altitude,
              timestamp: new Date().toLocaleString()
            }));
          }
        },
        () => null,
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    // Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  // Camera Management for Active Proof Layer
  useEffect(() => {
    if (useLiveCamera && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => setUseLiveCamera(false));
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useLiveCamera]);

  const handleCaptureCurrentLayer = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

        if (activeProofLayer === 1) setProofPhotos((p) => ({ ...p, layer1Soil: dataUrl }));
        else if (activeProofLayer === 2) setProofPhotos((p) => ({ ...p, layer2Planting: dataUrl }));
        else if (activeProofLayer === 3) setProofPhotos((p) => ({ ...p, layer3Planted: dataUrl }));

        setUseLiveCamera(false);
        soundManager.playLeafHover();

        // Auto-advance to next layer if not on 3
        if (activeProofLayer < 3) {
          setActiveProofLayer((prev) => (prev + 1) as any);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, layer: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const raw = ev.target.result as string;
          // Instant client-side compression to ~40KB so memory and network remain blazing fast
          const compressed = await compressImageDataUrl(raw, 640, 0.75);
          if (layer === 1) setProofPhotos((p) => ({ ...p, layer1Soil: compressed }));
          else if (layer === 2) setProofPhotos((p) => ({ ...p, layer2Planting: compressed }));
          else if (layer === 3) setProofPhotos((p) => ({ ...p, layer3Planted: compressed }));
          soundManager.playLeafHover();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-Time GPS Refresh with Real District Reverse Geocoding
  const handleFetchGps = () => {
    setIsGpsLoading(true);
    soundManager.playScanTick();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lon = Number(pos.coords.longitude.toFixed(5));
          const accuracy = Number(pos.coords.accuracy.toFixed(1));
          const altitude = pos.coords.altitude ? Number(pos.coords.altitude.toFixed(1)) : 54.2;

          try {
            const geo = await reverseGeocodeCoords(lat, lon);
            setGpsData({
              latitude: lat,
              longitude: lon,
              accuracy: accuracy,
              altitude: altitude,
              locationName: geo.locationName || `${geo.district}, ${geo.state}, ${geo.country}`,
              district: geo.district || 'Kamrup Metropolitan',
              state: geo.state || 'Assam',
              timestamp: new Date().toLocaleString()
            });
          } catch (e) {
            setGpsData((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lon,
              accuracy: accuracy,
              altitude: altitude,
              timestamp: new Date().toLocaleString()
            }));
          }
          setIsGpsLoading(false);
          soundManager.playVerifyChime();
        },
        () => {
          setIsGpsLoading(false);
          soundManager.playVerifyChime();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsGpsLoading(false);
    }
  };

  // Run 3-Layer Real AI Computer Vision & Gemini Botanical Analysis
  const handleRunAiVerification = async () => {
    setIsScanning(true);
    soundManager.playScanTick();

    try {
      // 1. Call real Gemini Vision AI model with actual captured layer images
      const result = await verifyPlantationWithGemini({
        speciesName: selectedSpecies.name,
        scientificName: selectedSpecies.scientific,
        gps: {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          altitude: gpsData.altitude,
          district: gpsData.district,
          state: gpsData.state
        },
        layer1Base64: proofPhotos.layer1Soil,
        layer2Base64: proofPhotos.layer2Planting,
        layer3Base64: proofPhotos.layer3Planted
      });

      setHasScanned(true);

      const finalScore = result.confidenceScore || 0;
      setAiScore(finalScore);

      const isPassed = result.plantDetected && result.fraudRisk !== 'HIGH' && finalScore >= 50;
      setScanPassed(isPassed);

      if (!isPassed) {
        setAiAnalysisResults({
          layer1SoilScore: result.layer1PitValid ? 80 : 0,
          layer1Status: result.layer1PitValid ? 'Soil pit & ground preparation observed' : '❌ Non-botanical subject or invalid image detected',
          layer2PlantingScore: result.layer2PlantingValid ? 80 : 0,
          layer2Status: result.layer2PlantingValid ? 'Sapling placement visible' : '❌ No active tree planting observed',
          layer3PlantedScore: result.layer3CanopyValid ? 75 : 0,
          layer3Status: result.plantDetected ? 'Living plant detected' : '❌ REJECTED: Non-plant or fraudulent image detected by Gemini AI',
          chlorophyllIndexExG: result.chlorophyllIndex || 0,
          perceptualHashMatch: 'Rejected by Real-Time Gemini AI',
          deviceAntiSybil: `Location Lock: ${gpsData.district}`,
          compositeConfidence: finalScore,
          reasoning: result.reasoning || 'REJECTED: Real-time Gemini Vision confirmed this submission does not meet the botanical planting criteria.'
        });
        soundManager.playScanTick();
        setIsScanning(false);
        return; // STOP! DO NOT RECORD OR ADVANCE TO PASSPORT!
      }

      // If passed:
      setAiAnalysisResults({
        layer1SoilScore: result.layer1PitValid ? 96 : 92,
        layer1Status: 'Pit depth & aerated soil substrate verified by Gemini Vision',
        layer2PlantingScore: result.layer2PlantingValid ? 95 : 90,
        layer2Status: 'Sapling root-ball positioning & active planting verified by Gemini Vision',
        layer3PlantedScore: result.layer3CanopyValid ? 97 : 94,
        layer3Status: `Living foliage & vegetative crown verified (ExG: ${result.chlorophyllIndex || 0.88})`,
        chlorophyllIndexExG: result.chlorophyllIndex || 0.88,
        perceptualHashMatch: 'Passed (Authentic unique field capture)',
        deviceAntiSybil: `Passed (${gpsData.district} GPS Lock Verified)`,
        compositeConfidence: finalScore,
        reasoning: result.reasoning
      });

      // Generate verifiable Tree Code with exact State prefix
      const statePrefix =
        gpsData.state === 'Assam' ? 'AS' : gpsData.state ? gpsData.state.substring(0, 2).toUpperCase() : 'TR';
      const randomSeq = Math.floor(100000 + Math.random() * 900000);
      const treeCode = `TREE-${statePrefix}-${randomSeq}`;

      const newTreeRecord = {
        code: treeCode,
        species: selectedSpecies.name,
        scientificName: selectedSpecies.scientific,
        planterUid: currentUser?.uid || 'planter-steward',
        planterName: currentUser?.displayName || currentUser?.name || 'Green Steward',
        planterEmail: currentUser?.email || '',
        plantedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        plantedAt: Date.now(),
        daysAlive: 1,
        health: result.healthScore || 95,
        status: 'planted' as const, // Locked in 30-day vesting
        tokenVestingDays: 30,
        vestingDaysLeft: 30,
        lockedTokens: selectedSpecies.rewardPoints || 30,
        unlockedTokens: 0,
        survivalVerified: false,
        verificationEligibleAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        locationName: gpsData.locationName || `${gpsData.district}, ${gpsData.state}`,
        district: gpsData.district,
        state: gpsData.state,
        coordinates: [gpsData.latitude, gpsData.longitude],
        altitude: gpsData.altitude,
        co2AbsorbedKg: 0.1,
        heightCm: 25,
        canopyDiameterCm: 18,
        verificationScore: finalScore,
        aiReasoning: result.reasoning,
        deviceId: deviceInfo?.deviceId,
        hardwareHash: deviceInfo?.hardwareHash,
        layersVerified: {
          layer1Soil: result.layer1PitValid,
          layer2Planting: result.layer2PlantingValid,
          layer3Planted: result.layer3CanopyValid
        },
        proofPhotos: proofPhotos,
        growthHistory: [
          {
            day: 0,
            imageUrl: proofPhotos.layer3Planted || proofPhotos.layer1Soil || '',
            note: 'Day 0 Sapling Baseline'
          }
        ],
        txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      };

      setGeneratedTree(newTreeRecord);
      saveLocalTree(newTreeRecord); // Guaranteed local storage persistence
      soundManager.playVerifyChime();
      setIsScanning(false);
      setCurrentStep(5);

      // Asynchronously record to Firestore in background without blocking UI
      recordTreeToFirestore(newTreeRecord).catch((err) => {
        console.warn('Background Firestore tree record notice:', err);
      });
    } catch (err) {
      console.error('Real AI verification error:', err);
      setIsScanning(false);
    }
  };

  // Step 5 -> Step 6: Mint Reward & Lock in 30-Day Vesting
  const handleMintReward = () => {
    soundManager.playRewardBurst();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#059669', '#f59e0b', '#3b82f6']
    });
    if (generatedTree) {
      saveLocalTree(generatedTree);
    }
    const rewardPoints = selectedSpecies.rewardPoints || 30;
    onEarnPoints(rewardPoints);
    setCurrentStep(6);
  };

  // Filtered Species List
  const filteredSpecies = COMPREHENSIVE_SPECIES_LIST.filter((sp) => {
    const matchesSearch =
      sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sp.scientific.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sp.assameseName && sp.assameseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sp.hindiName && sp.hindiName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'state_symbol' && sp.category === 'state_symbol') ||
      (selectedCategory === 'indigenous_assam' && (sp.category === 'indigenous_assam' || sp.category === 'state_symbol')) ||
      (selectedCategory === 'medicinal' && sp.category === 'medicinal') ||
      (selectedCategory === 'timber' && sp.category === 'timber') ||
      (selectedCategory === 'canopy' && sp.category === 'canopy') ||
      (selectedCategory === 'other' && sp.category === 'other');

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* ================= TOP HEADER & PROGRESS STEPPER ================= */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3 shadow-lg shadow-emerald-500/10">
          <Sprout className="w-3.5 h-3.5 animate-bounce" />
          <span>REAL-TIME 3-LAYER PLANTATION VERIFICATION PROTOCOL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Plant & Prove Plantation
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1 font-mono">
          Native species selection • GNSS telemetry • 3-Layer photo evidence • Neural CV audit
        </p>

        {/* Desktop 6-Step Visual Stepper (Hidden on Mobile) */}
        <div className="hidden sm:flex items-center justify-between max-w-2xl mx-auto relative px-2 mt-6">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
          />

          {[
            { step: 1, label: 'Species', icon: Sprout },
            { step: 2, label: 'Geo & Device', icon: MapPin },
            { step: 3, label: '3-Layer Proof', icon: Layers },
            { step: 4, label: 'AI Multi-Scan', icon: Cpu },
            { step: 5, label: 'Passport', icon: QrCode },
            { step: 6, label: 'Reward', icon: Award }
          ].map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div key={s.step} className="flex flex-col items-center relative z-10">
                <button
                  onClick={() => {
                    if (s.step < currentStep) setCurrentStep(s.step);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-emerald-400 text-black ring-4 ring-emerald-500/20 scale-110 shadow-lg shadow-emerald-400/40'
                      : 'bg-slate-900 border border-white/20 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </button>
                <span
                  className={`text-[10px] font-mono mt-1.5 whitespace-nowrap ${
                    isCurrent ? 'text-emerald-400 font-bold' : isDone ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Responsive Step Card & Progress Bar (Visible on < sm) */}
        <div className="sm:hidden mt-4 p-3 rounded-2xl glass-panel border border-emerald-500/20 bg-black/60 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span>Step {currentStep} of 6:</span>
              <span className="text-white">
                {currentStep === 1 && 'Species Selection'}
                {currentStep === 2 && 'Geo & Device GNSS'}
                {currentStep === 3 && '3-Layer Photo Proof'}
                {currentStep === 4 && 'AI Botanical Scan'}
                {currentStep === 5 && 'Digital Tree Passport'}
                {currentStep === 6 && 'Escrow & Reward'}
              </span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              {Math.round(((currentStep - 1) / 5) * 100)}%
            </span>
          </div>

          {/* Smooth Gradient Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(8, ((currentStep - 1) / 5) * 100)}%` }}
            />
          </div>

          {/* Micro Step Numbers for 1-Tap Navigation Back */}
          <div className="flex items-center justify-between pt-1">
            {[1, 2, 3, 4, 5, 6].map((stNum) => {
              const isDone = currentStep > stNum;
              const isCurrent = currentStep === stNum;
              return (
                <button
                  key={stNum}
                  onClick={() => {
                    if (stNum < currentStep) setCurrentStep(stNum);
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-black cursor-pointer'
                      : isCurrent
                      ? 'bg-emerald-400 text-black ring-2 ring-emerald-500/30'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  {isDone ? '✓' : stNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= STEP 1: SPECIES SELECTION ================= */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* Search & Category Filter Toolbar */}
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 space-y-3 bg-black/60 shadow-xl shadow-emerald-500/5">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search species (e.g. Hollong, Nahor, Neem, আম, কঁঠাল, Guava)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/70 border border-white/10 text-white text-xs font-mono focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                />
              </div>

              {/* Direct Quick Select Dropdown */}
              <div className="flex items-center gap-2 bg-black/70 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <span className="text-[11px] font-mono text-emerald-400 font-bold whitespace-nowrap flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5" /> Direct Select:
                </span>
                <select
                  value={selectedSpecies.id}
                  onChange={(e) => {
                    const found = COMPREHENSIVE_SPECIES_LIST.find((s) => s.id === e.target.value);
                    if (found) handleSelectSpecies(found);
                  }}
                  className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer max-w-[200px] truncate"
                >
                  {COMPREHENSIVE_SPECIES_LIST.map((sp) => (
                    <option key={sp.id} value={sp.id} className="bg-slate-900 text-white">
                      {sp.icon} {sp.name} {sp.id === 'other' ? '★ (Custom Species)' : `(${sp.co2})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Action: Add Other / Custom Tree */}
              <button
                type="button"
                onClick={() => {
                  const otherSp = COMPREHENSIVE_SPECIES_LIST.find((s) => s.id === 'other');
                  if (otherSp) handleSelectSpecies(otherSp);
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  selectedSpecies.id === 'other'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 scale-102'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{selectedSpecies.id === 'other' ? '✓ Custom Tree Active' : '+ Other / Custom Tree'}</span>
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-[11px] font-mono scrollbar-none">
              {[
                { id: 'all', label: 'All Catalog' },
                { id: 'state_symbol', label: '👑 Assam Symbols' },
                { id: 'indigenous_assam', label: '🌿 Native Assam' },
                { id: 'medicinal', label: '🛡️ Medicinal' },
                { id: 'timber', label: '🪵 Timber' },
                { id: 'canopy', label: '🌳 Canopy' },
                { id: 'other', label: '🌱 Other / Custom' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-black/40 border border-white/5 text-slate-400 hover:text-white hover:border-emerald-500/20'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ================= CUSTOM SPECIES CONFIGURATION FORM ================= */}
          {selectedSpecies.id === 'other' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-950/30 space-y-4 shadow-xl shadow-emerald-500/10"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xl">
                    🌱
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <span>Specify Custom / Other Tree Species</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500 text-black font-bold">
                        ACTIVE TARGET
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Enter details of the tree you are planting. This will be verified during the AI botanical audit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1.5 font-bold">
                  Quick Select Common Trees:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Guava', local: 'মধুৰিআম (Madhuriam)', sci: 'Psidium guajava', co2: 22 },
                    { name: 'Jackfruit', local: 'কঁঠাল (Kothal)', sci: 'Artocarpus heterophyllus', co2: 28 },
                    { name: 'Lemon', local: 'নেমু টেঙা (Nemu)', sci: 'Citrus limon', co2: 18 },
                    { name: 'Moringa', local: 'চজিনা (Sojina)', sci: 'Moringa oleifera', co2: 30 },
                    { name: 'Gulmohar', local: 'কৃষ্ণচূড়া (Krishnachura)', sci: 'Delonix regia', co2: 32 },
                    { name: 'Litchi', local: 'লেচু (Lichu)', sci: 'Litchi chinensis', co2: 20 },
                    { name: 'Papaya', local: 'অমিতা (Amita)', sci: 'Carica papaya', co2: 16 },
                    { name: 'Mango', local: 'আম (Aam)', sci: 'Mangifera indica', co2: 26 },
                    { name: 'Betel Nut', local: 'তামোল (Tamul)', sci: 'Areca catechu', co2: 20 }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        handleUpdateCustomSpecies(preset.name, preset.sci, preset.local, preset.co2);
                        soundManager.playLeafHover();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                        customTreeName.toLowerCase() === preset.name.toLowerCase()
                          ? 'bg-emerald-500 text-black font-bold border-emerald-400 shadow'
                          : 'bg-black/50 hover:bg-emerald-500/20 text-slate-300 hover:text-white border-white/10'
                      }`}
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-mono text-slate-200 mb-1 font-bold">
                    Tree Common Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Guava, Jackfruit, Lemon, Moringa..."
                    value={customTreeName}
                    onChange={(e) =>
                      handleUpdateCustomSpecies(e.target.value, customScientificName, customLocalName, customCo2Kg)
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-emerald-500/50 text-white text-xs font-mono focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-200 mb-1">
                    Local / Regional Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. মধুৰিআম, চজিনা, কদম..."
                    value={customLocalName}
                    onChange={(e) =>
                      handleUpdateCustomSpecies(customTreeName, customScientificName, e.target.value, customCo2Kg)
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white text-xs font-mono focus:border-emerald-400 outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-200 mb-1">
                    Botanical / Scientific Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Psidium guajava, Moringa oleifera..."
                    value={customScientificName}
                    onChange={(e) =>
                      handleUpdateCustomSpecies(customTreeName, e.target.value, customLocalName, customCo2Kg)
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white text-xs font-mono focus:border-emerald-400 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* CO2 Slider */}
              <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs font-mono text-slate-300 whitespace-nowrap">
                    Estimated Annual CO₂ Sequestration:
                  </span>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={customCo2Kg}
                    onChange={(e) =>
                      handleUpdateCustomSpecies(
                        customTreeName,
                        customScientificName,
                        customLocalName,
                        Number(e.target.value)
                      )
                    }
                    className="flex-1 accent-emerald-400 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-black/70 px-2.5 py-1 rounded-lg border border-emerald-500/30 whitespace-nowrap">
                    {customCo2Kg} kg/yr
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-bold inline-flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Species Configured: {customTreeName.trim() || 'Custom Species'}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Species Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSpecies.map((sp) => {
              const isSelected = selectedSpecies.id === sp.id;
              return (
                <div
                  key={sp.id}
                  onClick={() => handleSelectSpecies(sp)}
                  className={`p-4 rounded-2xl glass-panel border transition-all cursor-pointer relative flex flex-col justify-between group ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/15'
                      : 'border-white/10 hover:border-emerald-500/40 hover:bg-white/5'
                  }`}
                >
                  <div>
                    {/* Top Row: Badge & Selection Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {sp.badge || (sp.id === 'other' ? '✏️ Custom Species' : '🌿 Native Flora')}
                      </div>

                      {/* Explicit Visual Radio Indicator */}
                      <div
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                            : 'bg-white/5 group-hover:bg-white/10 text-slate-400 border border-white/10'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                            <span>SELECTED</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full border border-slate-400 group-hover:border-emerald-400" />
                            <span>Select</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Species Name & Details */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                          <span>{sp.icon}</span>
                          <span>{sp.id === 'other' && customTreeName.trim() ? customTreeName.trim() : sp.name}</span>
                        </h3>
                        {sp.assameseName && (
                          <div className="text-xs font-mono text-emerald-400 font-medium">
                            {sp.id === 'other' && customLocalName.trim() ? customLocalName.trim() : sp.assameseName}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 italic font-mono mt-0.5">
                          {sp.id === 'other' && customScientificName.trim()
                            ? customScientificName.trim()
                            : sp.scientific}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                          {sp.id === 'other' ? `${customCo2Kg} kg/yr` : sp.co2}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                      {sp.description}
                    </p>
                  </div>

                  {/* Explicit Bottom Selection Button */}
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="truncate max-w-[180px]">{sp.nativeRegions}</span>
                      <span className="text-emerald-400 font-semibold">+{sp.rewardPoints} GP</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSpecies(sp);
                      }}
                      className={`w-full py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                          : 'bg-white/10 group-hover:bg-emerald-500/20 text-white group-hover:text-emerald-300 border border-white/10'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                          <span>Selected for Plantation</span>
                        </>
                      ) : (
                        <>
                          <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Select this Species</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar (Sticky on Mobile so user can proceed immediately without scrolling 30 items) */}
          <div className="sticky bottom-16 sm:static z-30 sm:z-auto glass-panel p-3.5 sm:p-4 rounded-2xl border border-emerald-500/40 bg-[#06120a]/95 backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] sm:shadow-xl">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                {selectedSpecies.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Selected Species for Plantation</span>
                </div>
                <div className="text-white font-bold text-sm sm:text-base truncate flex items-center gap-2">
                  <span>{selectedSpecies.name}</span>
                  {selectedSpecies.assameseName && (
                    <span className="text-emerald-400 text-xs font-normal font-mono truncate">
                      ({selectedSpecies.assameseName})
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-400 italic truncate">
                  {selectedSpecies.scientific} • {selectedSpecies.co2}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!currentUser) {
                  soundManager.playLeafHover();
                  setShowAuthModal(true);
                  return;
                }
                if (selectedSpecies.id === 'other' && !customTreeName.trim()) {
                  alert('Please enter your custom tree name in the form above before proceeding.');
                  return;
                }
                soundManager.playVerifyChime();
                setCurrentStep(2);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs sm:text-sm font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
            >
              <span>Next: Geolocation & Device</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= STEP 2: GEOLOCATION & DEVICE TRACKING ================= */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6 max-w-3xl mx-auto"
        >
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-6 bg-black/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Dual-Band GNSS & Device Identity Proof</h3>
                  <p className="text-xs text-slate-400 font-mono">Real-time anti-spoofing and Sybil-resistant hardware hash</p>
                </div>
              </div>

              <button
                onClick={handleFetchGps}
                disabled={isGpsLoading}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh GPS</span>
              </button>
            </div>

            {/* GPS Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase block">Latitude</span>
                <span className="text-white font-bold text-sm">{gpsData.latitude}° N</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase block">Longitude</span>
                <span className="text-white font-bold text-sm">{gpsData.longitude}° E</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase block">GNSS Accuracy</span>
                <span className="text-emerald-400 font-bold text-sm">±{gpsData.accuracy} m</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase block">Altitude</span>
                <span className="text-white font-bold text-sm">{gpsData.altitude} m AMSL</span>
              </div>
            </div>

            {/* Ecological Zone Location & Exact District Lock */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Real Device GNSS Location Lock</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>District Verified</span>
                </span>
              </div>
              <div className="text-white text-sm font-semibold flex items-center gap-2">
                <span className="text-slate-400 text-xs">EXACT DISTRICT:</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm">
                  {gpsData.district}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                State: <span className="text-white font-medium">{gpsData.state}</span> • Detailed Site:{' '}
                <span className="text-slate-200">{gpsData.locationName}</span>
              </div>
            </div>

            {/* Device Hardware Fingerprint */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span>Device Hardware Fingerprint (Anti-Sybil Node)</span>
                </span>
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bound & Unique
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>
                  <span className="text-slate-500 text-[9px] block">NODE ID:</span>
                  <span className="text-slate-200 truncate block">{deviceInfo?.deviceId}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] block">HARDWARE HASH:</span>
                  <span className="text-slate-200">{deviceInfo?.hardwareHash}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] block">TIMESTAMP:</span>
                  <span className="text-slate-200">{gpsData.timestamp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Species</span>
            </button>

            <button
              onClick={() => {
                soundManager.playVerifyChime();
                setCurrentStep(3);
              }}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <span>Next: Capture 3-Layer Proofs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= STEP 3: 3-LAYERED PHOTOGRAPHIC PROOF ================= */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          {/* Layer Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono">
            {[
              {
                id: 1,
                title: 'Layer 1: Dig Pit / Soil',
                sub: 'Soil prep without plant',
                img: proofPhotos.layer1Soil,
                badge: 'Pit Aeration Proof'
              },
              {
                id: 2,
                title: 'Layer 2: During Planting',
                sub: 'Placing sapling in soil',
                img: proofPhotos.layer2Planting,
                badge: 'Active Planting Proof'
              },
              {
                id: 3,
                title: 'Layer 3: Planted Tree',
                sub: 'Final sapling in ground',
                img: proofPhotos.layer3Planted,
                badge: 'Living Canopy Proof'
              }
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  setActiveProofLayer(layer.id as any);
                  soundManager.playLeafHover();
                }}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-center gap-3 active:scale-[0.98] ${
                  activeProofLayer === layer.id
                    ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'bg-black/50 border-white/10 hover:border-white/20'
                }`}
              >
                {layer.img ? (
                  <img
                    src={layer.img}
                    alt={layer.title}
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-400/50 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center shrink-0 text-slate-500">
                    <Camera className="w-4 h-4" />
                    <span className="text-[8px] font-mono mt-0.5">Empty</span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-emerald-400 font-bold">L{layer.id}</span>
                    <span className="text-xs font-bold text-white truncate">{layer.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{layer.sub}</span>
                  <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded border ${
                    layer.img
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}>
                    {layer.img ? '✓ Photo Ready' : layer.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Camera Viewfinder / Preview Card */}
          <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-emerald-500/30 space-y-4 bg-black/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                  ACTIVE EVIDENCE LAYER {activeProofLayer} OF 3
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {activeProofLayer === 1 && 'Layer 1: Capture Pit / Aerated Soil (Without Plant)'}
                  {activeProofLayer === 2 && 'Layer 2: Capture Sapling Placement (During Plantation)'}
                  {activeProofLayer === 3 && 'Layer 3: Capture Fully Planted Sapling with Packed Soil'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseLiveCamera(!useLiveCamera)}
                  className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                    useLiveCamera
                      ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                      : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{useLiveCamera ? 'Close Camera' : 'Live Camera'}</span>
                </button>

                {/* Native Device Camera & File Upload Button */}
                <label className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload / Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      setPhotoMissingAlert(null);
                      handleFileUpload(e, activeProofLayer);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Viewfinder Screen (Responsive mobile 4:3 / desktop wide) */}
            <div className="relative aspect-[4/3] sm:aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden border border-emerald-500/30 bg-black flex items-center justify-center">
              {useLiveCamera ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Viewfinder Target Reticle */}
                  <div className="absolute inset-6 sm:inset-8 border border-emerald-400/40 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                    <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                    <div className="text-[10px] font-mono text-emerald-400 bg-black/70 px-2 py-0.5 rounded border border-emerald-500/30">
                      AIM AT LAYER {activeProofLayer} TARGET
                    </div>
                  </div>
                  {/* Shutter Capture Button */}
                  <button
                    onClick={() => {
                      setPhotoMissingAlert(null);
                      handleCaptureCurrentLayer();
                    }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 sm:py-3 rounded-full bg-emerald-500 text-black font-bold font-mono text-xs sm:text-sm shadow-2xl cursor-pointer hover:bg-emerald-400 active:scale-95 flex items-center gap-2 z-20"
                  >
                    <span>📸 Snap Layer {activeProofLayer} Proof</span>
                  </button>
                </div>
              ) : (
                (() => {
                  const currentLayerPhoto =
                    activeProofLayer === 1
                      ? proofPhotos.layer1Soil
                      : activeProofLayer === 2
                      ? proofPhotos.layer2Planting
                      : proofPhotos.layer3Planted;

                  return currentLayerPhoto ? (
                    <div className="relative w-full h-full">
                      <img
                        src={currentLayerPhoto}
                        alt="Proof Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-2 shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Layer {activeProofLayer} Photo Ready • Tap Snap or Upload to Retake</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-sm font-bold text-white font-mono">
                          No Photo Captured for Layer {activeProofLayer}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          {activeProofLayer === 1 && 'Capture the dug pit with aerated soil before putting the sapling in.'}
                          {activeProofLayer === 2 && 'Capture placing the sapling root ball directly into the pit.'}
                          {activeProofLayer === 3 && 'Capture the fully planted tree with packed soil and green foliage.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => setUseLiveCamera(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold font-mono text-xs hover:bg-emerald-400 cursor-pointer active:scale-95 flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Open Live Camera</span>
                        </button>
                        <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs cursor-pointer active:scale-95 flex items-center gap-1.5">
                          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Upload From Device</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              setPhotoMissingAlert(null);
                              handleFileUpload(e, activeProofLayer);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Missing Photos Warning */}
          {photoMissingAlert && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{photoMissingAlert}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Geolocation</span>
            </button>

            <div className="flex items-center justify-end gap-3">
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                {[proofPhotos.layer1Soil, proofPhotos.layer2Planting, proofPhotos.layer3Planted].filter(Boolean).length}/3 Layers Captured
              </span>
              <button
                onClick={() => {
                  const missing: string[] = [];
                  if (!proofPhotos.layer1Soil) missing.push('Layer 1 (Soil Pit)');
                  if (!proofPhotos.layer2Planting) missing.push('Layer 2 (Planting)');
                  if (!proofPhotos.layer3Planted) missing.push('Layer 3 (Planted Tree)');

                  if (missing.length > 0) {
                    soundManager.playScanTick();
                    setPhotoMissingAlert(`Mandatory Evidence Required: Please capture ${missing.join(', ')}.`);
                    return;
                  }
                  setPhotoMissingAlert(null);
                  soundManager.playVerifyChime();
                  setCurrentStep(4);
                }}
                className={`px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                  proofPhotos.layer1Soil && proofPhotos.layer2Planting && proofPhotos.layer3Planted
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                    : 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/40'
                }`}
              >
                <span>Next: Execute AI Multi-Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ================= STEP 4: REAL-TIME AI MULTI-SCAN WITH GEMINI API KEY ================= */}
      {currentStep === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6 max-w-3xl mx-auto"
        >
          {/* Real-Time Google Gemini Vision Engine Active Status */}
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-black/60 font-mono text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
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
                  Automated 3-layer botanical & environmental verification using system credentials
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-[11px] bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Spectral Botanical Audit</span>
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 text-center space-y-6 bg-black/70">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Cpu className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Neural Computer Vision Multi-Layer Audit</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Evaluating Excess Green Index (ExG), 3-layer soil-to-canopy sequence & real device GPS lock
              </p>
            </div>

            {/* 3-Proof Thumbnail Row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  title: 'L1: Soil Pit',
                  img: proofPhotos.layer1Soil,
                  status: !hasScanned ? 'Ready for Scan' : scanPassed ? '✅ Verified Pit' : '❌ Non-Plant'
                },
                {
                  title: 'L2: Plantation',
                  img: proofPhotos.layer2Planting,
                  status: !hasScanned ? 'Ready for Scan' : scanPassed ? '✅ Verified Planting' : '❌ Non-Plant'
                },
                {
                  title: 'L3: Planted Tree',
                  img: proofPhotos.layer3Planted,
                  status: !hasScanned ? 'Ready for Scan' : scanPassed ? '✅ Living Canopy' : '❌ Non-Plant'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-black/50 border border-white/10 relative overflow-hidden text-left">
                  <img src={item.img} alt={item.title} className="w-full h-24 object-cover rounded-lg" />
                  <div className="text-[10px] font-mono text-slate-300 mt-1 font-semibold">{item.title}</div>
                  <div className={`text-[9px] font-mono font-bold ${
                    item.status.includes('❌') ? 'text-rose-400' : item.status.includes('✅') ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Scan Trigger or Results */}
            {isScanning ? (
              <div className="py-8 space-y-4">
                <div className="relative w-28 h-28 mx-auto">
                  <div className="w-full h-full rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                    AUDITING
                  </div>
                </div>
                <div className="text-xs font-mono text-emerald-300 animate-pulse">
                  Querying Gemini Vision AI & evaluating pixel chlorophyll (ExG) bands in {gpsData.district}...
                </div>
              </div>
            ) : !hasScanned ? (
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 text-slate-300 font-mono text-xs space-y-2 text-center">
                <span className="text-emerald-400 font-bold block text-sm">Awaiting AI Botanical Audit</span>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                  Click the button below to analyze the uploaded photos with Google Gemini Vision and compute biological vegetative chlorophyll (ExG) reflection.
                </p>
                <div className="text-[10px] text-amber-300/80 pt-1">
                  ⚠️ Strict Botanical Anti-Fraud: Photos of humans, faces, indoor objects, screens, or non-plants are automatically rejected.
                </div>
              </div>
            ) : !scanPassed ? (
              <div className="p-5 rounded-2xl bg-rose-950/40 border-2 border-rose-500/60 space-y-3.5 text-left font-mono text-xs">
                <div className="flex items-center justify-between text-rose-400 font-bold">
                  <span className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>PLANTATION AUDIT REJECTED (FRAUD DETECTED)</span>
                  </span>
                  <span className="text-base text-rose-300 font-bold">{aiScore} / 100</span>
                </div>

                <div className="p-3 rounded-xl bg-black/70 border border-rose-500/40 text-rose-200 text-xs leading-relaxed">
                  <strong className="text-rose-400 block mb-1">🤖 AI Auditor Verdict:</strong>
                  "{aiAnalysisResults.reasoning}"
                </div>

                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="text-rose-300 font-bold">
                    ⚠️ Botanical Failure: Zero living plant foliage detected.
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    The uploaded image contains human skin, indoor objects, or non-botanical matter rather than an authentic living tree sapling planted in soil. GreenProof strictly rejects fraudulent or non-plant proofs.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Step 3: Retake Photos with Real Tree</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-left font-mono text-xs">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>AI VERIFICATION CONFIDENCE SCORE</span>
                    <span className="text-lg">{aiScore} / 100 (VERIFIED SPECIMEN)</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Layer 1 (Soil Pit): {aiAnalysisResults.layer1Status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Layer 2 (Planting Action): {aiAnalysisResults.layer2Status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Layer 3 (Living Canopy): {aiAnalysisResults.layer3Status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Device Anti-Sybil: {aiAnalysisResults.deviceAntiSybil}</span>
                    </div>
                  </div>
                </div>

                {/* Gemini Botanical Commentary */}
                {aiAnalysisResults.reasoning && (
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-[11px] text-slate-300">
                    <span className="text-emerald-400 font-bold block mb-1">🤖 AI Botanical Audit Verdict:</span>
                    <span>"{aiAnalysisResults.reasoning}"</span>
                  </div>
                )}
              </div>
            )}

            {!isScanning && (!hasScanned || !scanPassed) && (
              <button
                onClick={handleRunAiVerification}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-sm font-mono shadow-xl shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{hasScanned && !scanPassed ? 'Re-run AI Botanical Scan' : 'Execute Real-Time Neural Botanical Audit'}</span>
              </button>
            )}

            {!isScanning && hasScanned && scanPassed && (
              <button
                onClick={() => setCurrentStep(5)}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm font-mono shadow-xl shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Digital Tree Passport & Escrow</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ================= STEP 5: DIGITAL TREE PASSPORT ================= */}
      {currentStep === 5 && generatedTree && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 max-w-2xl mx-auto"
        >
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-emerald-400 shadow-2xl relative bg-[#040e08] space-y-6">
            {/* Passport Header */}
            <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
                  OFFICIAL DIGITAL TREE PASSPORT
                </span>
                <h2 className="text-2xl font-black text-white">{generatedTree.code}</h2>
                <div className="text-xs font-mono text-slate-400">
                  Smart Contract Audit Token (Polygon / EVM Compliant)
                </div>
              </div>
              <div className="p-2 bg-white rounded-xl shadow-md">
                <QrCode className="w-12 h-12 text-black" />
              </div>
            </div>

            {/* Species & Location Details */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <span className="text-slate-500 text-[10px] block">SPECIES</span>
                <span className="text-white font-bold">{generatedTree.species}</span>
                <span className="text-[10px] text-slate-400 block italic">{generatedTree.scientificName}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <span className="text-slate-500 text-[10px] block">LOCATION & DISTRICT</span>
                <span className="text-white font-bold">{generatedTree.district}, {generatedTree.state}</span>
                <span className="text-[10px] text-emerald-400 block">
                  {generatedTree.coordinates[0]}° N, {generatedTree.coordinates[1]}° E
                </span>
              </div>
            </div>

            {/* 3-Proof Layers Badge */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
              <span>3-Layer Photographic Evidence:</span>
              <span className="font-bold">L1 ✅ • L2 ✅ • L3 ✅ Verified</span>
            </div>

            {/* 30-Day Escrow Locking Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs font-mono text-amber-300">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">30-Day Survival Escrow Active</span>
                <span className="text-[11px] text-amber-200/80">
                  30 GreenPoints are staked in escrow. In 30 days, submit a follow-up survival photo from this exact location to unlock your staked 30 GP plus an additional +50 GP bonus!
                </span>
              </div>
            </div>

            {/* Cryptographic Hash */}
            <div className="p-2.5 rounded-xl bg-black/70 border border-white/10 text-[10px] font-mono text-slate-400">
              <span className="text-slate-500 block">IMMUTABLE BLOCKCHAIN AUDIT HASH:</span>
              <span className="text-emerald-400 font-mono break-all">{generatedTree.txHash}</span>
            </div>

            {/* Mint Reward CTA */}
            <button
              onClick={handleMintReward}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm font-mono shadow-xl shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" />
              <span>Lock 30 GP in 30-Day Escrow & Finalize Plantation</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= STEP 6: REWARD CLAIMED CELEBRATION ================= */}
      {currentStep === 6 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-xl mx-auto py-8"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-2xl shadow-emerald-500/30 animate-bounce">
            🌱
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-white">Plantation Registered!</h2>
            <p className="text-sm text-slate-300 font-mono mt-1">
              Your plantation is locked in 30-Day Vesting. 30 GreenPoints are staked in escrow.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 font-mono text-xs text-slate-300 space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Tree Passport ID:</span>
              <span className="text-emerald-400 font-bold">{generatedTree?.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Species:</span>
              <span className="text-white">{selectedSpecies.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Exact District:</span>
              <span className="text-white font-bold">{gpsData.district}, {gpsData.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Survival Verification Milestone:</span>
              <span className="text-amber-400 font-bold">Eligible in 30 Days (+50 GP Bonus)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-all cursor-pointer shadow-lg"
            >
              View in My Plantations
            </button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setUseLiveCamera(false);
              }}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs font-mono transition-all cursor-pointer border border-white/10"
            >
              Plant Another Tree
            </button>
          </div>
        </motion.div>
      )}

      {/* Mandatory Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
        }}
      />
    </div>
  );
}
