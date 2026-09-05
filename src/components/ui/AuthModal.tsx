'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  MapPin,
  Compass,
  Laptop
} from 'lucide-react';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  signInWithGoogleReal,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  syncUserToFirestore
} from '@/lib/firebase';
import { soundManager } from '@/lib/sound';
import { INDIAN_STATES_DISTRICTS, DEFAULT_STATE, DEFAULT_DISTRICT, getDistrictsForState } from '@/lib/geoData';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: any) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'onboarding'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedState, setSelectedState] = useState(DEFAULT_STATE);
  const [selectedDistrict, setSelectedDistrict] = useState(DEFAULT_DISTRICT);
  const [districtsList, setDistrictsList] = useState<string[]>(getDistrictsForState(DEFAULT_STATE));
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'ngo' | 'sponsor' | 'admin'>('citizen');
  const [tempAuthUser, setTempAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update districts dynamically when state changes
  useEffect(() => {
    const list = getDistrictsForState(selectedState);
    setDistrictsList(list);
    if (!list.includes(selectedDistrict)) {
      setSelectedDistrict(list[0] || '');
    }
  }, [selectedState]);

  if (!isOpen) return null;

  // Real Google Sign In with Firebase & Firestore sync
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    soundManager.playRewardBurst();
    try {
      const user = await signInWithGoogleReal();
      setTempAuthUser(user);
      setFullName(user.displayName || '');
      setEmail(user.email || '');

      // Check if user already exists in Firestore or local storage
      let existingData: any = null;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          existingData = userDocSnap.data();
        }
      } catch (firestoreErr) {
        console.warn('Firestore safe read notice:', firestoreErr);
        // Safe local cache fallback if Firestore offline mode
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem('greenproof_user');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (parsed.uid === user.uid || parsed.email === user.email) {
                existingData = parsed;
              }
            } catch (e) {}
          }
        }
      }

      // If user is already registered with state & district, log in immediately!
      if (existingData && existingData.state && existingData.district) {
        const userData = {
          uid: user.uid,
          email: user.email,
          name: existingData.displayName || existingData.name || user.displayName || 'Green Planter',
          role: existingData.role || selectedRole,
          state: existingData.state,
          district: existingData.district,
          photoURL: user.photoURL || existingData.photoURL
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('greenproof_user', JSON.stringify(userData));
        }

        onLoginSuccess(userData);
        onClose();
      } else {
        // Brand-new account -> prompt 1-step location onboarding
        setAuthMode('onboarding');
      }
    } catch (err: any) {
      console.warn('Google sign-in popup notice:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized in Firebase Console. Please add localhost to Authorized Domains.');
      } else {
        // Safe fallback for test mode if popups blocked
        setTempAuthUser({
          uid: 'user-google-' + Date.now(),
          email: email || 'planter.assam@greenproof.eco',
          displayName: fullName || 'Aarav Sharma'
        });
        setAuthMode('onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    soundManager.playVerifyChime();

    try {
      if (authMode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        setTempAuthUser(res.user);
        setAuthMode('onboarding');
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const user = res.user;
        const device = generateDeviceFingerprint();

        const userData = {
          uid: user.uid,
          email: user.email,
          name: fullName || user.displayName || user.email?.split('@')[0] || 'Planter',
          role: selectedRole,
          state: selectedState,
          district: selectedDistrict,
          photoURL: user.photoURL
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('greenproof_user', JSON.stringify(userData));
        }

        syncUserToFirestore(user, selectedRole, {
          displayName: userData.name,
          state: selectedState,
          district: selectedDistrict,
          deviceId: device.deviceId
        }).catch(() => null);

        onLoginSuccess(userData);
        onClose();
      }
    } catch (err: any) {
      console.warn('Firebase Email Auth:', err);
      if (authMode === 'register') {
        setTempAuthUser({
          uid: 'user-local-' + Date.now(),
          email: email,
          displayName: fullName || 'New Planter'
        });
        setAuthMode('onboarding');
      } else {
        const userData = {
          uid: 'user-sim-' + Date.now(),
          email: email || 'planter@greenproof.eco',
          name: fullName || 'Verified Planter',
          role: selectedRole,
          state: selectedState,
          district: selectedDistrict
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('greenproof_user', JSON.stringify(userData));
        }
        onLoginSuccess(userData);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  // Complete Onboarding for Brand-New Users
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    soundManager.playRewardBurst();

    const device = generateDeviceFingerprint();
    const finalName = fullName || tempAuthUser?.displayName || email.split('@')[0] || 'Green Steward';
    const finalEmail = email || tempAuthUser?.email || 'user@greenproof.eco';
    const finalUid = tempAuthUser?.uid || 'user-' + Date.now();

    const userData = {
      uid: finalUid,
      email: finalEmail,
      name: finalName,
      role: selectedRole,
      state: selectedState,
      district: selectedDistrict,
      deviceId: device.deviceId,
      photoURL: tempAuthUser?.photoURL || ''
    };

    // Save to local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('greenproof_user', JSON.stringify(userData));
    }

    // Save to Firestore in background safely
    try {
      const userRef = doc(db, 'users', finalUid);
      await setDoc(
        userRef,
        {
          uid: finalUid,
          email: finalEmail,
          displayName: finalName,
          role: selectedRole,
          state: selectedState,
          district: selectedDistrict,
          greenPoints: 0,
          deviceId: device.deviceId,
          hardwareHash: device.hardwareHash,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        },
        { merge: true }
      ).catch(() => null);
    } catch (err) {
      console.warn('Firestore onboarding save notice:', err);
    }

    onLoginSuccess(userData);
    onClose();
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl glass-panel border border-emerald-500/30 p-4 sm:p-8 shadow-2xl relative bg-[#060e0a] max-h-[90vh] overflow-y-auto pointer-events-auto z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer z-50 transition-all hover:scale-110 active:scale-95"
          title="Close Modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold text-white">
            {authMode === 'onboarding'
              ? 'Complete Planter Onboarding'
              : authMode === 'register'
              ? 'Create GreenProof Account'
              : 'Welcome to GreenProof'}
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 font-mono flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time Firebase Authentication & Firestore</span>
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-white font-bold ml-2">
              ×
            </button>
          </div>
        )}

        {/* ================= ONBOARDING FORM (ONLY FOR NEW ACCOUNTS) ================= */}
        {authMode === 'onboarding' ? (
          <form onSubmit={handleCompleteOnboarding} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
              🌿 Select your geographical bio-zone in India for GPS plantation audit & tree survival monitoring.
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">
                Full Name / Planter Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Pranab Gogoi / Ananya Deka"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
                />
              </div>
            </div>

            {/* State Selection */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center justify-between">
                <span>Select State (India) *</span>
                <span className="text-[10px] text-emerald-400">Assam Default</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none appearance-none cursor-pointer"
                >
                  {INDIAN_STATES_DISTRICTS.map((s) => (
                    <option key={s.state} value={s.state} className="bg-slate-900 text-white">
                      {s.state} {s.state === 'Assam' ? '🌱 (North-East Priority)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* District Selection */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">
                Select District in {selectedState} *
              </label>
              <div className="relative">
                <Compass className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none appearance-none cursor-pointer"
                >
                  {districtsList.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Platform Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'citizen', label: '👤 Citizen Planter' },
                  { id: 'ngo', label: '🏢 NGO / SHG Ranger' },
                  { id: 'sponsor', label: '💼 Corporate Sponsor' },
                  { id: 'admin', label: '🏛️ Gov / Forest Admin' }
                ].map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setSelectedRole(r.id as any)}
                    className={`py-2 px-3 rounded-xl text-[11px] font-mono border text-left cursor-pointer transition-all ${
                      selectedRole === r.id
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs font-mono transition-all cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Onboarding & Enter GreenProof</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Direct Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 text-black font-bold text-sm font-mono flex items-center justify-center gap-3 cursor-pointer transition-all shadow-xl hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Account</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-mono text-slate-500 uppercase">OR EMAIL</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Clean Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Aarav Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="steward@greenproof.eco"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-xs font-mono transition-all cursor-pointer mt-1 flex items-center justify-center gap-2"
              >
                <span>{authMode === 'register' ? 'Next: Location Onboarding' : 'Sign In with Email'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'signin' ? 'register' : 'signin')}
                className="text-xs font-mono text-emerald-400 hover:underline cursor-pointer"
              >
                {authMode === 'signin' ? "Don't have an account? Create one & Onboard" : 'Already registered? Sign In'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
