'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasWrapper from '../3d/CanvasWrapper';
import MyForestScene from '../3d/MyForestScene';
import TreeProfileScene from '../3d/TreeProfileScene';
import { USER_TREES } from '@/lib/constants';
import { TreeData, TreeHealth } from '@/types';
import { soundManager } from '@/lib/sound';
import {
  TreeDeciduous,
  Heart,
  Calendar,
  MapPin,
  X,
  Sliders,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';

interface MyForestViewProps {
  onNavigate?: (view: string) => void;
}

export default function MyForestView({ onNavigate }: MyForestViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | TreeHealth>('all');
  const [selectedTree, setSelectedTree] = useState<TreeData | null>(USER_TREES[0]);
  const [timelineDay, setTimelineDay] = useState<number>(120);

  const filteredTrees = USER_TREES.filter((t) => {
    if (selectedFilter === 'all') return true;
    return t.status === selectedFilter;
  });

  const handleSelectTree = (tree: TreeData) => {
    soundManager.playLeafHover();
    setSelectedTree(tree);
    setTimelineDay(tree.daysAlive);
  };

  const TIMELINE_POINTS = [0, 30, 90, 180, 365];

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-3">
            <TreeDeciduous className="w-3.5 h-3.5 text-emerald-400" />
            PERSONAL BIOSPHERE ENCLAVE
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            My Living <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-mint">Forest</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl">
            Each 3D tree represents an actual physical plantation verified by our AI computer vision and satellite passes.
          </p>
        </div>

        {/* Aggregate Summary Badges */}
        <div className="flex flex-wrap gap-2">
          <div className="px-4 py-2 rounded-2xl glass-panel border border-emerald-500/20 text-center">
            <span className="text-[10px] font-mono text-slate-400 block">TOTAL TREES</span>
            <span className="text-xl font-bold font-mono text-white">8 Planted</span>
          </div>
          <div className="px-4 py-2 rounded-2xl glass-panel border border-emerald-500/20 text-center">
            <span className="text-[10px] font-mono text-slate-400 block">CO2 ABSORBED</span>
            <span className="text-xl font-bold font-mono text-emerald-400">170.6 kg</span>
          </div>
          <div className="px-4 py-2 rounded-2xl glass-panel border border-emerald-500/20 text-center">
            <span className="text-[10px] font-mono text-slate-400 block">SURVIVAL RATE</span>
            <span className="text-xl font-bold font-mono text-mint">87.5%</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'healthy', 'moderate', 'critical', 'dead'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => {
              soundManager.playLeafHover();
              setSelectedFilter(filter);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === filter
                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : 'glass-button text-slate-400 hover:text-white'
            }`}
          >
            {filter} {filter !== 'all' && `(${USER_TREES.filter((t) => t.status === filter).length})`}
          </button>
        ))}
      </div>

      {/* Main 3D Layout: Miniature Forest + Tree Profile Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center: Interactive Miniature 3D Forest */}
        <div className="lg:col-span-7 rounded-3xl glass-panel border border-emerald-500/25 p-4 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-mono text-slate-300 border-b border-emerald-500/20 mb-2">
            <span>3D INTERACTIVE GLADE</span>
            <span className="text-emerald-400">CLICK ANY TREE TO INSPECT</span>
          </div>

          <div className="h-[440px] sm:h-[520px] rounded-2xl overflow-hidden bg-[#040f09] relative">
            <CanvasWrapper camera={{ position: [0, 6, 8], fov: 42 }}>
              <MyForestScene
                trees={filteredTrees}
                selectedTreeId={selectedTree?.id}
                onSelectTree={handleSelectTree}
              />
            </CanvasWrapper>

            {/* Health legend */}
            <div className="absolute bottom-4 left-4 p-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-emerald-500/20 flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                Healthy
              </span>
              <span className="flex items-center gap-1 text-yellow-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                Moderate
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                Critical
              </span>
              <span className="flex items-center gap-1 text-stone-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#78716c]" />
                Dead
              </span>
            </div>
          </div>
        </div>

        {/* Right: Detailed 3D Tree Profile & Growth Timeline */}
        <div className="lg:col-span-5 rounded-3xl glass-panel border border-emerald-500/30 p-6 space-y-6 shadow-2xl relative">
          {selectedTree ? (
            <>
              {/* Tree Identification Bar */}
              <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400/80">INSPECTED SPECIMEN:</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">
                    {selectedTree.code}
                  </h3>
                  <p className="text-sm font-semibold text-emerald-300">
                    {selectedTree.species}{' '}
                    <span className="text-xs italic text-slate-400">({selectedTree.scientificName})</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono uppercase px-2.5 py-1 rounded-full border ${
                    selectedTree.status === 'healthy'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : selectedTree.status === 'moderate'
                      ? 'bg-yellow-950 text-yellow-300 border-yellow-500/50'
                      : 'bg-orange-950 text-orange-300 border-orange-500/50'
                  }`}>
                    {selectedTree.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400 block mt-1">
                    {selectedTree.health}% Health
                  </span>
                </div>
              </div>

              {/* Single Detailed 3D Tree Viewport */}
              <div className="h-56 rounded-2xl overflow-hidden bg-[#040f09] relative border border-emerald-500/20">
                <div className="absolute top-2 left-3 z-10 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-emerald-400">
                  DAY {timelineDay} GROWTH MORPH
                </div>
                <CanvasWrapper camera={{ position: [0, 1.2, 3.8], fov: 45 }}>
                  <TreeProfileScene tree={selectedTree} growthDay={timelineDay} />
                </CanvasWrapper>
              </div>

              {/* Timeline Slider (Day 0 -> 30 -> 90 -> 180 -> 365) as requested in prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">GROWTH TIMELINE</span>
                  <span className="text-emerald-400 font-bold">DAY {timelineDay}</span>
                </div>

                <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                  {TIMELINE_POINTS.map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        soundManager.playLeafHover();
                        setTimelineDay(day);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        timelineDay === day
                          ? 'bg-emerald-500 text-black shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
                      }`}
                    >
                      D{day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl glass-card border border-emerald-500/20">
                  <span className="text-slate-400 font-mono block">CANOPY CALIPER</span>
                  <span className="text-base font-bold text-white font-mono">
                    {selectedTree.canopyDiameterCm} cm
                  </span>
                </div>
                <div className="p-3 rounded-xl glass-card border border-emerald-500/20">
                  <span className="text-slate-400 font-mono block">STEM HEIGHT</span>
                  <span className="text-base font-bold text-white font-mono">
                    {selectedTree.heightCm} cm
                  </span>
                </div>
                <div className="p-3 rounded-xl glass-card border border-emerald-500/20">
                  <span className="text-slate-400 font-mono block">CO2 ABSORBED</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {selectedTree.co2AbsorbedKg} kg
                  </span>
                </div>
                <div className="p-3 rounded-xl glass-card border border-emerald-500/20">
                  <span className="text-slate-400 font-mono block">LAST VERIFIED</span>
                  <span className="text-base font-bold text-white font-mono">
                    {selectedTree.lastVerified}
                  </span>
                </div>
              </div>

              {/* Location & Token Vesting Footer */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex flex-col gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{selectedTree.locationName}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 font-mono text-[11px]">
                  <span className="text-amber-400">🔒 30 GP Locked in Vesting</span>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('survival');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold cursor-pointer transition-all"
                  >
                    Upload Day 30 Photo
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Info className="w-8 h-8 mb-2" />
              <p>Select any tree to view detailed profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
