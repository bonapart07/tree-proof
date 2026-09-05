'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import CanvasWrapper from '../3d/CanvasWrapper';
import RewardTokenScene from '../3d/RewardTokenScene';
import { REWARDS_CATALOG } from '@/lib/constants';
import { RewardItem } from '@/types';
import { soundManager } from '@/lib/sound';
import {
  Coins,
  Sparkles,
  Sprout,
  Package,
  TicketPercent,
  HeartHandshake,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface RewardsViewProps {
  greenPoints: number;
  onEarnPoints: (amount: number) => void;
  onSpendPoints: (amount: number) => boolean;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Coins,
  plant: Sprout,
  product: Package,
  discount: TicketPercent,
  donate: HeartHandshake,
};

export default function RewardsView({
  greenPoints,
  onEarnPoints,
  onSpendPoints,
}: RewardsViewProps) {
  const [isBursting, setIsBursting] = useState(false);
  const [redeemedNotice, setRedeemedNotice] = useState<string | null>(null);

  const handleClaimDailyPoints = (e: React.MouseEvent) => {
    soundManager.playRewardBurst();
    setIsBursting(true);
    onEarnPoints(30);

    // Particle burst outward
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 50,
      spread: 90,
      origin: { x, y },
      colors: ['#10b981', '#34d399', '#fbbf24', '#a7f3d0'],
      shapes: ['circle'],
      scalar: 1.1,
    });

    setTimeout(() => setIsBursting(false), 2000);
  };

  const handleRedeem = (item: RewardItem) => {
    soundManager.playLeafHover();
    const success = onSpendPoints(item.pointsCost);
    if (success) {
      soundManager.playVerifyChime();
      setRedeemedNotice(`Redeemed: ${item.title}`);
      setTimeout(() => setRedeemedNotice(null), 3500);
    } else {
      alert(`Insufficient GreenPoints! You need ${item.pointsCost} GP.`);
    }
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          NATURAL CAPITAL LIQUIDITY
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          3D GreenPoints <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-mint">Reward Wallet</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2">
          Earn verified environmental yield. Every surviving tree generates recurring liquid GreenPoints backed by institutional ESG buyers.
        </p>
      </div>

      {/* Central 3D Wallet Hub */}
      <div className="rounded-3xl glass-panel border border-emerald-500/30 p-8 mb-14 relative overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: 3D Floating Emerald Token */}
          <div className="lg:col-span-6 h-72 sm:h-80 rounded-2xl overflow-hidden relative bg-[#040f09] border border-emerald-500/20">
            <div className="absolute top-3 left-4 z-10 text-[11px] font-mono text-emerald-400">
              3D EMERALD ASSET CORE
            </div>
            <CanvasWrapper camera={{ position: [0, 0, 3.2], fov: 45 }}>
              <RewardTokenScene isBursting={isBursting} />
            </CanvasWrapper>
          </div>

          {/* Right: Balance & Claim Trigger */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                AVAILABLE LIQUID BALANCE
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-extrabold font-mono text-white tracking-tight">
                  {greenPoints.toLocaleString()}
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  GreenPoints
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-2">
                ≈ ${(greenPoints * 0.05).toFixed(2)} USD Verified Eco Equity
              </p>
            </div>

            {/* Daily Staking Claim */}
            <div className="p-4 rounded-2xl glass-card border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white block">
                  Daily Survival Staking Claim
                </span>
                <span className="text-xs text-slate-400">
                  +30 GP generated by your 8 active surviving trees
                </span>
              </div>
              <button
                onClick={handleClaimDailyPoints}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-mint text-black font-bold text-xs shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Claim +30 GP</span>
              </button>
            </div>

            {/* Notification alert banner */}
            <AnimatePresence>
              {redeemedNotice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{redeemedNotice}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Reforestation Marketplace Catalog */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white">
              GreenPoint Redemption Marketplace
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Select an option to convert your verified environmental tokens into physical impact.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/50">
            5 REWARDS AVAILABLE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REWARDS_CATALOG.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || Coins;
            const canAfford = greenPoints >= item.pointsCost;

            return (
              <div
                key={item.id}
                className="rounded-2xl glass-card border border-emerald-500/20 p-6 flex flex-col justify-between hover:border-emerald-400/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                      {item.badge}
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-emerald-500/15 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">COST</span>
                    <span className="text-base font-bold font-mono text-white">
                      {item.pointsCost} GP
                    </span>
                  </div>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      canAfford
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{canAfford ? 'Redeem' : 'Need More GP'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
