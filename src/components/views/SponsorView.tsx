'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  Building2,
  TreeDeciduous,
  ShieldCheck,
  TrendingUp,
  Download,
  Sparkles,
  FileCheck,
  X,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

const MONTHLY_PROGRESS_DATA = [
  { month: 'Month 1', planted: 2100, verified: 1980, surviving: 1950, carbonTons: 12.4 },
  { month: 'Month 2', planted: 4200, verified: 3910, surviving: 3820, carbonTons: 28.1 },
  { month: 'Month 3', planted: 6500, verified: 5890, surviving: 5610, carbonTons: 49.3 },
  { month: 'Month 4', planted: 8200, verified: 7420, surviving: 6980, carbonTons: 71.0 },
  { month: 'Month 5', planted: 9400, verified: 8310, surviving: 7650, carbonTons: 92.5 },
  { month: 'Month 6', planted: 10000, verified: 8742, surviving: 7981, carbonTons: 114.8 },
];

export default function SponsorView() {
  const [showReportModal, setShowReportModal] = useState(false);

  // Exact figures from prompt:
  // Campaign: "Green Assam 2027", Budget: ₹10,00,000, Target: 10,000 trees, Verified: 8,742, Surviving: 7,981, Survival: 91.3%
  const campaign = {
    title: 'Green Assam 2027',
    sponsorName: 'Tata CleanTech & Sustainability',
    budgetInr: '₹10,00,000',
    targetTrees: 10000,
    verifiedTrees: 8742,
    survivingTrees: 7981,
    survivalRate: 91.3,
    carbonOffsetTons: 114.8,
    region: 'Assam Ecological Corridors (Kamrup, Sonitpur, Jorhat)'
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-3">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ENTERPRISE ESG & CSR PORTFOLIO</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Corporate <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-mint">Sponsor Portal</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-2xl">
            Real-time auditable climate impact portfolio for corporate CSR compliance.
            Audited using Sentinel-2 multispectral imagery and computer vision.
          </p>
        </div>

        <button
          onClick={() => {
            soundManager.playRewardBurst();
            setShowReportModal(true);
          }}
          className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Impact Report</span>
        </button>
      </div>

      {/* Campaign Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-emerald-500/30 mb-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">ACTIVE CSR CAMPAIGN</span>
          <h2 className="text-2xl font-bold text-white mt-0.5">{campaign.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2 font-mono">
            <span>Sponsor: {campaign.sponsorName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              {campaign.region}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-mono text-slate-400">ESCROW BUDGET</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{campaign.budgetInr}</div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden sm:block" />
          <div className="text-right">
            <div className="text-xs font-mono text-slate-400">SURVIVAL RATE</div>
            <div className="text-2xl font-bold font-mono text-teal-300">{campaign.survivalRate}%</div>
          </div>
        </div>
      </div>

      {/* 5 Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20 shadow-xl">
          <span className="text-xs font-mono text-slate-400 block mb-1">TARGET TREES</span>
          <span className="text-2xl font-bold font-mono text-white">{campaign.targetTrees.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Goal commitment</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20 shadow-xl">
          <span className="text-xs font-mono text-slate-400 block mb-1">TREES VERIFIED</span>
          <span className="text-2xl font-bold font-mono text-emerald-300">{campaign.verifiedTrees.toLocaleString()}</span>
          <span className="text-[11px] text-emerald-400 font-mono block mt-1">87.4% achieved</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/40 bg-emerald-950/20 shadow-xl">
          <span className="text-xs font-mono text-emerald-300 font-semibold block mb-1">TREES SURVIVING</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{campaign.survivingTrees.toLocaleString()}</span>
          <span className="text-[11px] text-emerald-300 block mt-1">Primary impact metric</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20 shadow-xl">
          <span className="text-xs font-mono text-slate-400 block mb-1">CO₂ SEQUESTERED</span>
          <span className="text-2xl font-bold font-mono text-teal-300">{campaign.carbonOffsetTons} Tons</span>
          <span className="text-[11px] text-slate-500 block mt-1">GHG Protocol L1</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20 shadow-xl">
          <span className="text-xs font-mono text-slate-400 block mb-1">REWARD DISTRIBUTED</span>
          <span className="text-2xl font-bold font-mono text-white">1,82,400 GP</span>
          <span className="text-[11px] text-slate-500 block mt-1">To local community</span>
        </div>
      </div>

      {/* Analytics Visualization using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Chart: Survival Growth Trajectory */}
        <div className="lg:col-span-8 rounded-3xl glass-panel border border-emerald-500/20 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Verified Plantation & Survival Progression</h3>
              <p className="text-xs text-slate-400">Cumulative trees verified vs actual verified surviving trees</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Planted
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Surviving
              </span>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_PROGRESS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSurviving" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#02180c', borderColor: '#10b981', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="planted" stroke="#475569" strokeWidth={2} fillOpacity={0} />
                <Area type="monotone" dataKey="surviving" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSurviving)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Carbon Sequestration Growth */}
        <div className="lg:col-span-4 rounded-3xl glass-panel border border-emerald-500/20 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Carbon Sequestration (Tons CO₂)</h3>
            <p className="text-xs text-slate-400 mb-4">Cumulative atmospheric carbon trapped</p>

            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_PROGRESS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#02180c', borderColor: '#34d399', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="carbonTons" fill="#34d399" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 mt-4">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ISO 14064-2 & GHG Protocol Audit</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Smart Contract: 0x71C2...465F</div>
          </div>
        </div>
      </div>

      {/* Downloadable ESG Impact Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl glass-panel border border-emerald-500/40 p-6 sm:p-8 shadow-2xl relative bg-[#060e0a]">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full glass-panel hover:text-white text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <FileCheck className="w-8 h-8 text-emerald-400" />
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase">OFFICIAL AUDIT REPORT</span>
                <h3 className="text-xl font-bold text-white">GreenProof ESG Certification</h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs text-slate-300 space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">CAMPAIGN:</span>
                <span className="text-white">{campaign.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SPONSOR ENTITY:</span>
                <span className="text-white">{campaign.sponsorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">FINANCIAL ALLOCATION:</span>
                <span className="text-emerald-400">{campaign.budgetInr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TARGET PLANTATIONS:</span>
                <span className="text-white">10,000 Specimens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VERIFIED SURVIVING:</span>
                <span className="text-emerald-400 font-bold">{campaign.survivingTrees.toLocaleString()} (91.3% Survival Rate)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CARBON OFFSET CERTIFIED:</span>
                <span className="text-teal-300 font-bold">{campaign.carbonOffsetTons} Metric Tons CO₂</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BLOCKCHAIN AUDIT HASH:</span>
                <span className="text-slate-400 break-all">0x71c2db194300a29487c95bf2fe44f3a921d7465f</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2.5 rounded-full glass-panel text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  soundManager.playVerifyChime();
                  alert('ESG Audit Report PDF generated and downloaded to device.');
                  setShowReportModal(false);
                }}
                className="px-6 py-2.5 rounded-full bg-emerald-500 text-black font-bold text-xs font-mono cursor-pointer hover:bg-emerald-400 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Audit Pack</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
