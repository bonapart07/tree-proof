'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CanvasWrapper from '../3d/CanvasWrapper';
import HeroLeafScene, { GrowthStage } from '../3d/HeroLeafScene';
import DigitalForestScene from '../3d/DigitalForestScene';
import HowItWorks3D from '../3d/HowItWorks3D';
import ImpactCounter from '../ui/ImpactCounter';
import { soundManager } from '@/lib/sound';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  Trees,
  Sparkles,
  ChevronDown,
  Globe2,
  Cpu,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (tab: any) => void;
}

const STORY_STEPS = [
  {
    step: '01',
    title: 'Seed',
    quote: '“Every forest starts with one.”',
    desc: 'Tiny, resilient, and holding the blueprint for an entire ecosystem. GreenProof begins the verification log the moment planting is scheduled.',
    stage: 'seed' as GrowthStage,
  },
  {
    step: '02',
    title: 'Plant',
    quote: '“Plant a tree. Capture the origin.”',
    desc: 'Local planters and rangers log initial geolocation with high-precision GNSS sensors and anti-spoofing telemetry.',
    stage: 'sprout' as GrowthStage,
  },
  {
    step: '03',
    title: 'Verify',
    quote: '“Prove it. Don’t trust blindly.”',
    desc: 'AI computer vision inspects chlorophyll index, stem calipers, and ground features against Sentinel-2 multispectral passes.',
    stage: 'leaf' as GrowthStage,
  },
  {
    step: '04',
    title: 'Protect',
    quote: '“Keep it alive. True impact takes time.”',
    desc: 'Continuous survival monitoring at Day 30, 90, 180, and 365 days ensures saplings survive beyond photo ops.',
    stage: 'tree' as GrowthStage,
  },
  {
    step: '05',
    title: 'Reward',
    quote: '“Earn for verified longevity.”',
    desc: 'Liquid GreenPoints are minted exclusively upon passing survival milestones, aligning climate action with real financial value.',
    stage: 'leaf' as GrowthStage,
  },
  {
    step: '06',
    title: 'Impact',
    quote: '“Grow a living future.”',
    desc: 'From an isolated seedling to self-sustaining digital biospheres — completely verified and publicly auditable.',
    stage: 'forest' as GrowthStage,
  },
];

export default function LandingView({ onNavigate }: LandingViewProps) {
  const [heroStage, setHeroStage] = useState<GrowthStage>('leaf');
  const [activeStoryIdx, setActiveStoryIdx] = useState(2);

  const handleStageSelect = (stage: GrowthStage) => {
    soundManager.playLeafHover();
    setHeroStage(stage);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-24 pb-16 px-4">
        {/* Subtle Background Radial Forest Glow */}
        <div className="absolute inset-0 pointer-events-none radial-forest-gradient" />

        {/* Hero Header & Title */}
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center mt-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 backdrop-blur-md text-emerald-300 text-xs font-mono mb-4 shadow-lg shadow-emerald-500/10"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AI SATELLITE & BOTANICAL VISION PLATFORM</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-3"
          >
            Plant Trees.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-mint to-teal-300 glow-text">
              Prove Their Impact.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            AI-powered plantation verification and survival monitoring for a greener future.
            Every surviving tree is a living digital asset.
          </motion.p>
        </div>

        {/* Dedicated 3D Interactive Leaf Stage Showcase */}
        <div className="relative z-10 w-full max-w-4xl h-[440px] sm:h-[540px] my-2 rounded-3xl overflow-hidden glass-panel border border-emerald-500/25 shadow-2xl relative">
          {/* Interaction Guide Hint Badge */}
          <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>3D BOTANICAL LEAF • DRAG TO ROTATE 360°</span>
          </div>

          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/20 text-[10px] font-mono text-slate-400">
            <span>TRANSLUCENT CELLULAR VEIN NETWORK</span>
          </div>

          <CanvasWrapper camera={{ position: [0, 0, 4.2], fov: 45 }}>
            <HeroLeafScene stage={heroStage} enableControls={true} />
          </CanvasWrapper>

          {/* Morph Switcher embedded in bottom of 3D frame */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-full bg-black/75 border border-emerald-500/30 backdrop-blur-xl">
            <span className="text-[11px] font-mono text-emerald-400/80 px-2 uppercase tracking-wider hidden sm:inline">
              MORPH:
            </span>
            {(['seed', 'sprout', 'leaf', 'tree'] as GrowthStage[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStageSelect(st)}
                className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-all cursor-pointer ${
                  heroStage === st
                    ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-emerald-950/40'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons Below 3D Leaf */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-6"
        >
          <button
            onClick={() => {
              soundManager.playRewardBurst();
              onNavigate('verify');
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-400/40 hover:scale-105 transition-all cursor-pointer group"
          >
            <Sprout className="w-5 h-5 text-black" />
            <span>Plant a Tree & Verify</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              soundManager.playLeafHover();
              onNavigate('myforest');
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-full glass-button font-medium text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer hover:border-emerald-400"
          >
            <Trees className="w-5 h-5 text-emerald-400" />
            <span>Explore My Living Forest</span>
          </button>
        </motion.div>

        {/* Scroll down indicator */}
        <div className="flex flex-col items-center gap-1 text-slate-500 text-xs font-mono mt-12">
          <span>SCROLL FOR REFORESTATION SAGA</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-emerald-400" />
        </div>
      </section>

      {/* ================= STORY SCROLL EXPERIENCE ================= */}
      <section className="relative py-28 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            NARRATIVE ARC
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            The Living Digital Leaf Saga
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Click through each milestone to witness the transformation from dormant seed to self-sustaining forest.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Interactive 3D Lifecycle Stage Window */}
          <div className="lg:col-span-6 h-[440px] rounded-3xl glass-panel border border-emerald-500/25 overflow-hidden relative shadow-2xl p-4">
            <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-300 uppercase">
                ACTIVE PHASE: {STORY_STEPS[activeStoryIdx].title}
              </span>
            </div>

            <CanvasWrapper camera={{ position: [0, 0, 4.5], fov: 45 }}>
              <HeroLeafScene stage={STORY_STEPS[activeStoryIdx].stage} />
            </CanvasWrapper>

            <div className="absolute bottom-4 left-6 right-6 p-4 rounded-2xl glass-card border border-emerald-500/20">
              <p className="text-xs font-mono text-emerald-400">
                {STORY_STEPS[activeStoryIdx].quote}
              </p>
            </div>
          </div>

          {/* Right: Steps Timeline Accordion */}
          <div className="lg:col-span-6 space-y-3">
            {STORY_STEPS.map((s, idx) => {
              const isSelected = activeStoryIdx === idx;
              return (
                <div
                  key={s.step}
                  onClick={() => {
                    soundManager.playLeafHover();
                    setActiveStoryIdx(idx);
                  }}
                  className={`p-5 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'glass-card border-emerald-400/60 bg-emerald-950/40 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-emerald-500 text-black font-bold' : 'text-slate-500 bg-slate-800'
                      }`}>
                        {s.step}
                      </span>
                      <h4 className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {s.title}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-400/80">
                      {isSelected ? 'ACTIVE 3D' : 'EXPLORE'}
                    </span>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 text-xs text-slate-300 leading-relaxed font-normal"
                    >
                      {s.desc}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 3D HOW IT WORKS CARDS ================= */}
      <HowItWorks3D />

      {/* ================= IMPACT STATISTICS ================= */}
      <ImpactCounter />

      {/* ================= DIGITAL FOREST SECTION ================= */}
      <section className="relative py-28 px-4 max-w-7xl mx-auto">
        <div className="rounded-3xl glass-panel border border-emerald-500/25 overflow-hidden p-8 sm:p-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-6 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                INSTANCED 3D BIOSPHERE
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                The Digital Forest Ecosystem
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Hundreds of verified plantations synced live via GPU-accelerated instanced meshes.
                Inspect tree canopy density, individual tree health grades, and real-time carbon absorption.
              </p>
              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={() => onNavigate('map')}
                  className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
                >
                  <Globe2 className="w-4 h-4" />
                  <span>Open Full-Screen Map</span>
                </button>
                <button
                  onClick={() => onNavigate('myforest')}
                  className="px-6 py-3 rounded-full glass-button text-sm cursor-pointer"
                >
                  <span>My Planted Trees</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 h-[420px] rounded-2xl overflow-hidden relative border border-emerald-500/20 bg-[#050e09]">
              <div className="absolute top-3 right-4 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
                120+ TREES INSTANCED • 60 FPS
              </div>
              <CanvasWrapper camera={{ position: [0, 8, 14], fov: 45 }}>
                <DigitalForestScene treeCount={130} />
              </CanvasWrapper>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section className="relative py-20 px-4 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6">
          Ready to Grow Proof?
        </h2>
        <p className="text-slate-400 text-base mb-8 max-w-xl mx-auto">
          Join thousands of environmental stewards using computer vision and satellite telemetry to heal the planet.
        </p>
        <button
          onClick={() => {
            soundManager.playRewardBurst();
            onNavigate('verify');
          }}
          className="px-10 py-5 rounded-full bg-gradient-to-r from-emerald-500 via-mint to-teal-400 text-black font-bold text-base shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-3"
        >
          <Sprout className="w-6 h-6 text-black" />
          <span>Launch AI Verification Studio</span>
          <ArrowRight className="w-5 h-5 text-black" />
        </button>
      </section>
    </div>
  );
}
