'use client';

import React from 'react';
import { motion } from 'framer-motion';
import CanvasWrapper from '../3d/CanvasWrapper';
import TreeProfileScene from '../3d/TreeProfileScene';
import { LEADERBOARD_CHAMPIONS, USER_TREES } from '@/lib/constants';
import { LeaderboardUser } from '@/types';
import { soundManager } from '@/lib/sound';
import { Trophy, Award, Sparkles, Trees, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function LeaderboardView() {
  const top3 = LEADERBOARD_CHAMPIONS.slice(0, 3);
  const others = LEADERBOARD_CHAMPIONS.slice(3);

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-4">
          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
          GLOBAL BIOME STEWARDSHIP
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          3D Living Forest <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-mint">Leaderboard</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2">
          Rankings are calculated strictly from long-term verified tree survival, not unverified sapling numbers.
        </p>
      </div>

      {/* Top 3 Champions: 3D Forest Podiums */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
        {/* Rank 2 Podium */}
        <motion.div
          whileHover={{ y: -6 }}
          className="rounded-3xl glass-card border border-emerald-500/20 p-6 flex flex-col items-center text-center relative overflow-hidden order-2 md:order-1"
        >
          <div className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-xs font-mono text-slate-300 font-bold">
            #2 SILVER BIOME
          </div>

          <div className="w-full h-48 my-2 relative">
            <CanvasWrapper camera={{ position: [0, 1.2, 3.5], fov: 45 }}>
              <TreeProfileScene tree={USER_TREES[1]} growthDay={280} />
            </CanvasWrapper>
          </div>

          <img
            src={top3[1].avatar}
            alt={top3[1].name}
            className="w-14 h-14 rounded-full border-2 border-slate-300 -mt-7 mb-2 object-cover shadow-lg"
          />
          <h3 className="text-lg font-bold text-white">{top3[1].name}</h3>
          <span className="text-xs font-mono text-emerald-400 mb-3">{top3[1].badgeTitle}</span>

          <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-emerald-500/15 text-xs font-mono">
            <div className="p-2 rounded-xl bg-black/40">
              <span className="text-slate-400 text-[10px] block">SURVIVING</span>
              <span className="text-white font-bold">{top3[1].survivingTrees} Trees</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40">
              <span className="text-slate-400 text-[10px] block">RATE</span>
              <span className="text-emerald-400 font-bold">{top3[1].survivalRate}%</span>
            </div>
          </div>
        </motion.div>

        {/* Rank 1 Podium (Tallest / Champion) */}
        <motion.div
          whileHover={{ y: -8 }}
          className="rounded-3xl glass-panel border border-emerald-400/50 p-6 flex flex-col items-center text-center relative overflow-hidden order-1 md:order-2 shadow-2xl shadow-emerald-500/15 -translate-y-2 md:-translate-y-4"
        >
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-xs font-mono text-amber-300 font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>#1 TREE CHAMPION</span>
          </div>

          <div className="w-full h-56 my-2 relative">
            <CanvasWrapper camera={{ position: [0, 1.4, 3.8], fov: 45 }}>
              <TreeProfileScene tree={USER_TREES[0]} growthDay={365} />
            </CanvasWrapper>
          </div>

          <img
            src={top3[0].avatar}
            alt={top3[0].name}
            className="w-16 h-16 rounded-full border-2 border-amber-400 -mt-8 mb-2 object-cover shadow-xl shadow-amber-400/20"
          />
          <h3 className="text-xl font-bold text-white">{top3[0].name}</h3>
          <span className="text-xs font-mono text-amber-300 mb-3">{top3[0].badgeTitle}</span>

          <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-emerald-500/20 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
              <span className="text-slate-400 text-[10px] block">SURVIVING</span>
              <span className="text-emerald-300 font-bold text-sm">{top3[0].survivingTrees} Trees</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
              <span className="text-slate-400 text-[10px] block">SURVIVAL RATE</span>
              <span className="text-mint font-bold text-sm">{top3[0].survivalRate}%</span>
            </div>
          </div>
        </motion.div>

        {/* Rank 3 Podium */}
        <motion.div
          whileHover={{ y: -6 }}
          className="rounded-3xl glass-card border border-emerald-500/20 p-6 flex flex-col items-center text-center relative overflow-hidden order-3"
        >
          <div className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700/50 text-xs font-mono text-amber-400 font-bold">
            #3 BRONZE BIOME
          </div>

          <div className="w-full h-48 my-2 relative">
            <CanvasWrapper camera={{ position: [0, 1.2, 3.5], fov: 45 }}>
              <TreeProfileScene tree={USER_TREES[4]} growthDay={220} />
            </CanvasWrapper>
          </div>

          <img
            src={top3[2].avatar}
            alt={top3[2].name}
            className="w-14 h-14 rounded-full border-2 border-amber-600 -mt-7 mb-2 object-cover shadow-lg"
          />
          <h3 className="text-lg font-bold text-white">{top3[2].name}</h3>
          <span className="text-xs font-mono text-emerald-400 mb-3">{top3[2].badgeTitle}</span>

          <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-emerald-500/15 text-xs font-mono">
            <div className="p-2 rounded-xl bg-black/40">
              <span className="text-slate-400 text-[10px] block">SURVIVING</span>
              <span className="text-white font-bold">{top3[2].survivingTrees} Trees</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40">
              <span className="text-slate-400 text-[10px] block">RATE</span>
              <span className="text-emerald-400 font-bold">{top3[2].survivalRate}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ranks #4 and #5 Listing */}
      <div className="rounded-3xl glass-panel border border-emerald-500/20 p-6 shadow-xl space-y-3">
        <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
          CONTENDER RANKS
        </h4>
        {others.map((champ) => (
          <div
            key={champ.id}
            className="p-4 rounded-2xl glass-card border border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-emerald-400/40 transition-all"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-sm font-mono font-bold text-slate-400 w-6">
                #{champ.rank}
              </span>
              <img
                src={champ.avatar}
                alt={champ.name}
                className="w-10 h-10 rounded-full border border-emerald-400/40 object-cover"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{champ.name}</h4>
                <span className="text-xs font-mono text-emerald-400">{champ.badgeTitle}</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto text-xs font-mono">
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">SURVIVING</span>
                <span className="text-white font-bold">{champ.survivingTrees} Trees</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">SURVIVAL RATE</span>
                <span className="text-emerald-400 font-bold">{champ.survivalRate}%</span>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-slate-400 block text-[10px]">CARBON</span>
                <span className="text-mint font-bold">{champ.carbonOffsetTons} Tons</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
