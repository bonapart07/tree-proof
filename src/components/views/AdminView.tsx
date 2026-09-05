'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CanvasWrapper from '../3d/CanvasWrapper';
import HowItWorks3D from '../3d/HowItWorks3D';
import { ADMIN_TELEMETRY } from '@/lib/constants';
import { soundManager } from '@/lib/sound';
import {
  SlidersHorizontal,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Cpu,
  Radio,
  Satellite,
  Lock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export default function AdminView() {
  const [flags, setFlags] = useState(ADMIN_TELEMETRY.recentFlags);
  const [activeQueueCount, setActiveQueueCount] = useState(ADMIN_TELEMETRY.pendingVerifications);

  const handleResolveFlag = (id: string, action: 'dismissed' | 'rejected') => {
    soundManager.playLeafHover();
    setFlags((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
    setActiveQueueCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-3">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            OPERATIONS & INTEGRITY GATEWAY
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-mint">Telemetry Deck</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl">
            Autonomous fraud auditing, satellite cross-validation queues, and tamper-proofing telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>NEURAL VISION INFERENCE: ONLINE (99.8%)</span>
        </div>
      </div>

      {/* Top 4 Operations Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">PENDING QUEUE</span>
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-3xl font-bold font-mono text-white">
            {activeQueueCount}
          </span>
          <span className="text-[10px] text-amber-400 font-mono block mt-1">Manual Audits Required</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">AI ACCURACY</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-bold font-mono text-emerald-400">
            {ADMIN_TELEMETRY.aiAccuracyRate}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-1">F1 Score Across 140 Flora</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">GPS SPOOFING BLOCKED</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-3xl font-bold font-mono text-rose-400">
            {ADMIN_TELEMETRY.gpsSpoofingBlocked}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-1">Mock Location Rejections</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">SATELLITE MATCHED</span>
            <Satellite className="w-4 h-4 text-mint" />
          </div>
          <span className="text-3xl font-bold font-mono text-white">
            {ADMIN_TELEMETRY.satelliteCrossMatched.toLocaleString()}
          </span>
          <span className="text-[10px] text-mint font-mono block mt-1">Sentinel-2 Passes Verified</span>
        </div>
      </div>

      {/* Flagged Submissions Review List */}
      <div className="rounded-3xl glass-panel border border-emerald-500/25 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-bold text-white">
              Neural Anomaly Flags & Verification Queue
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            ACTION RESOLUTION LOG
          </span>
        </div>

        <div className="space-y-3">
          {flags.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl glass-card border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono font-bold text-white">
                    {item.treeCode}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    item.riskScore > 75
                      ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                      : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}>
                    RISK SCORE: {item.riskScore}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  TRIGGER: <span className="text-emerald-300">{item.flagType}</span> • Neural Confidence Discord Detected
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {item.status === 'investigating' ? (
                  <>
                    <button
                      onClick={() => handleResolveFlag(item.id, 'dismissed')}
                      className="px-4 py-1.5 rounded-full glass-button text-xs text-emerald-300 hover:bg-emerald-950/60 cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleResolveFlag(item.id, 'rejected')}
                      className="px-4 py-1.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs cursor-pointer flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Fraud</span>
                    </button>
                  </>
                ) : (
                  <span className={`text-xs font-mono uppercase px-3 py-1 rounded-full ${
                    item.status === 'dismissed' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                  }`}>
                    RESOLVED ({item.status})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
