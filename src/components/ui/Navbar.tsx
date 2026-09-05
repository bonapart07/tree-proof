'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout,
  Volume2,
  VolumeX,
  Menu,
  X,
  Coins,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  MapPin,
  Lock,
  Sparkles
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { auth, signOut } from '@/lib/firebase';
import AuthModal from './AuthModal';

export type NavTab = 'verify' | 'dashboard' | 'survival';
export type UserRole = 'citizen' | 'ngo' | 'sponsor' | 'admin';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: NavTab) => void;
  greenPoints: number;
  lockedPoints?: number;
  currentUser?: any;
  onSignOut?: () => void;
  onOpenAuthModal?: () => void;
}

// Strict Plantation-Only Core Tabs
const NAV_TABS = [
  { id: 'verify' as NavTab, label: '🌱 Plant New Tree', icon: ShieldCheck },
  { id: 'dashboard' as NavTab, label: '🌳 My Plantations', icon: LayoutDashboard },
  { id: 'survival' as NavTab, label: '⏳ 30-Day Verification', icon: CheckCircle2 },
];

export default function Navbar({
  activeTab,
  onTabChange,
  greenPoints,
  lockedPoints = 0,
  currentUser,
  onSignOut,
  onOpenAuthModal
}: NavbarProps) {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLocalAuthModal, setShowLocalAuthModal] = useState(false);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) soundManager.playVerifyChime();
  };

  const handleNavClick = (tab: NavTab) => {
    soundManager.playLeafHover();
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const handleSignOutClick = async () => {
    soundManager.playLeafHover();
    try {
      await signOut(auth);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('greenproof_user');
    }
    setShowUserDropdown(false);
    if (onSignOut) {
      onSignOut();
    }
  };

  const handleOpenAuth = () => {
    if (onOpenAuthModal) {
      onOpenAuthModal();
    } else {
      setShowLocalAuthModal(true);
    }
  };

  const isLoggedIn = !!currentUser;
  const displayName = currentUser?.displayName || currentUser?.name || 'Planter';
  const districtName = currentUser?.district || 'Kamrup Metropolitan';
  const stateName = currentUser?.state || 'Assam';

  return (
    <>
      {/* Top Floating Header */}
      <header className="fixed top-2 sm:top-3 left-0 right-0 z-40 px-2.5 sm:px-6 max-w-6xl mx-auto pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-panel border border-emerald-500/25 shadow-2xl backdrop-blur-2xl bg-[#060e0a]/90">
          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                GreenProof
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline">
                Live Protocol
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs (Hidden on Mobile) */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavClick(tab.id)}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium font-mono transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'text-emerald-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 rounded-full bg-emerald-500/15 border border-emerald-400/40 shadow-inner"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* GreenPoints & 30-Day Vesting Indicator */}
            {isLoggedIn && (
              <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-mono">
                <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold">{greenPoints.toLocaleString()} <span className="hidden xs:inline">GP</span></span>
                <span className="text-[10px] text-amber-400 hidden lg:inline flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5 inline" /> {lockedPoints > 0 ? `${lockedPoints.toLocaleString()} GP Escrow` : 'Escrow Live'}
                </span>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-1.5 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors cursor-pointer"
              title={isMuted ? 'Audio Muted' : 'Audio On'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* User Profile Dropdown or Sign In Button */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-mono hover:bg-emerald-500/25 transition-all cursor-pointer shadow-sm"
                >
                  <span className="text-amber-400 text-xs">🌱</span>
                  <span className="font-semibold hidden sm:inline">{displayName.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <>
                      {/* Mobile Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-40 bg-black/40 md:hidden"
                        onClick={() => setShowUserDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-64 rounded-2xl glass-panel border border-emerald-500/30 bg-[#060e0a]/95 p-3 shadow-2xl z-50 font-mono text-xs space-y-2 backdrop-blur-2xl"
                      >
                        <div className="pb-2 border-b border-white/10">
                          <div className="font-bold text-white text-xs truncate">{displayName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{currentUser.email || 'Verified Planter'}</div>
                          <div className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{districtName}, {stateName}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            handleNavClick('verify');
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-emerald-300 flex items-center gap-2 cursor-pointer text-xs"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Plant New Tree</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavClick('dashboard');
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-emerald-300 flex items-center gap-2 cursor-pointer text-xs"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>My Plantations</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavClick('survival');
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-emerald-300 flex items-center gap-2 cursor-pointer text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>30-Day Survival Checks</span>
                        </button>

                        <button
                          onClick={handleSignOutClick}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/10 text-red-400 flex items-center gap-2 cursor-pointer pt-2 border-t border-white/5 text-xs font-semibold"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={handleOpenAuth}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs font-mono hover:scale-105 transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                <Lock className="w-3 h-3 stroke-[2.5]" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Ergonomic Bottom Navigation Bar (Fixed for One-Thumb Reach on Screens < md) */}
      {isLoggedIn && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060e0a]/95 backdrop-blur-2xl border-t border-emerald-500/20 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] pb-safe pt-1.5 px-2 flex items-center justify-around select-none"
        >
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const shortLabel =
              tab.id === 'verify' ? 'Plant Tree' : tab.id === 'dashboard' ? 'My Trees' : 'Day 30';

            return (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id)}
                className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  isActive ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileBottomTabIndicator"
                    className="absolute inset-0 rounded-xl bg-emerald-500/15 border border-emerald-400/35"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <span className={`relative z-10 text-[10px] font-mono tracking-tight ${isActive ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                  {shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Auth Modal Fallback */}
      <AuthModal
        isOpen={showLocalAuthModal}
        onClose={() => setShowLocalAuthModal(false)}
        onLoginSuccess={() => setShowLocalAuthModal(false)}
      />
    </>
  );
}
