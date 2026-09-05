'use client';

import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { soundManager } from '@/lib/sound';
import { Sparkles, TreeDeciduous, ShieldCheck, HeartHandshake, ArrowUpRight } from 'lucide-react';

interface StatItemProps {
  label: string;
  value: number;
  suffix?: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onIncrement?: () => void;
}

function StatCounter({ label, value, suffix = '', sublabel, icon: Icon, color, onIncrement }: StatItemProps) {
  const springValue = useSpring(value * 0.85, { stiffness: 60, damping: 15 });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(Math.floor(latest));
    });
    return () => unsubscribe();
  }, [springValue]);

  const triggerLeafBurst = (e: React.MouseEvent) => {
    soundManager.playLeafHover();
    if (onIncrement) onIncrement();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 22,
      spread: 60,
      origin: { x, y },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#059669'],
      shapes: ['circle'],
      scalar: 0.9,
      ticks: 120,
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={triggerLeafBurst}
      className="relative p-6 rounded-2xl glass-card border border-emerald-500/20 hover:border-emerald-400/50 cursor-pointer overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-emerald-400/80 uppercase tracking-wider">
          {label}
        </span>
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <div className="flex items-baseline gap-1 my-2">
        <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
          {displayValue.toLocaleString()}
        </span>
        {suffix && (
          <span className="text-2xl font-bold text-emerald-400">{suffix}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
        <span>{sublabel}</span>
        <span className="text-emerald-400/70 group-hover:text-emerald-300 flex items-center gap-0.5 text-[10px] font-mono">
          <span>PULSE</span>
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>

      {/* Subtle animated border highlight */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

export default function ImpactCounter() {
  const [planted, setPlanted] = useState(24832);
  const [verified, setVerified] = useState(21492);
  const [surviving, setSurviving] = useState(18931);

  const survivalRate = Math.round((surviving / verified) * 100);

  const handleIncrementPlanted = () => {
    setPlanted((prev) => prev + 1);
    setVerified((prev) => prev + 1);
    setSurviving((prev) => prev + 1);
  };

  return (
    <div className="w-full py-16 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-3">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            LIVE TELEMETRY AGGREGATION
          </div>
          <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Measurable Environmental Proof
          </h3>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md font-mono">
          Click any counter to simulate real-time sensor pulses and trigger organic leaf emissions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCounter
          label="Trees Planted"
          value={planted}
          sublabel="100% Geo-tagged at planting"
          icon={TreeDeciduous}
          color="#10b981"
          onIncrement={handleIncrementPlanted}
        />
        <StatCounter
          label="AI Verified"
          value={verified}
          sublabel="Canopy & satellite match"
          icon={ShieldCheck}
          color="#34d399"
          onIncrement={handleIncrementPlanted}
        />
        <StatCounter
          label="Surviving"
          value={surviving}
          sublabel="Day 30 - 365 alive checks"
          icon={HeartHandshake}
          color="#4ade80"
          onIncrement={handleIncrementPlanted}
        />
        <StatCounter
          label="Survival Rate"
          value={survivalRate}
          suffix="%"
          sublabel="Benchmark vs 42% standard"
          icon={Sparkles}
          color="#6ee7b7"
          onIncrement={handleIncrementPlanted}
        />
      </div>
    </div>
  );
}
