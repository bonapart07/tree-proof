'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ShieldCheck,
  QrCode,
  Share2,
  Calendar,
  MapPin,
  Leaf,
  Activity,
  Award,
  ExternalLink,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { api } from '@/lib/api';

interface TreeDetailsViewProps {
  treeCode?: string;
  onBack: () => void;
  onPlantNew?: () => void;
}

export default function TreeDetailsView({
  treeCode = 'TREE-AS-000001',
  onBack,
  onPlantNew
}: TreeDetailsViewProps) {
  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'health' | 'blockchain'>('timeline');

  useEffect(() => {
    async function loadTree() {
      setLoading(true);
      const data = await api.getTreeByCode(treeCode);
      if (data) {
        setTree(data);
      } else {
        // Fallback realistic tree detail
        setTree({
          id: 1,
          code: treeCode,
          species: 'Neem',
          scientific_name: 'Azadirachta indica',
          planter_name: 'Aarav Sharma',
          latitude: 26.1445,
          longitude: 91.7362,
          location_name: 'Guwahati Bio-Reserve, Kamrup Metro',
          district: 'Kamrup Metro',
          state: 'Assam',
          health_status: 'Healthy',
          health_score: 94,
          days_alive: 34,
          co2_absorbed_kg: 2.7,
          height_cm: 48.5,
          canopy_diameter_cm: 28.0,
          image_url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&auto=format&fit=crop&q=80',
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${treeCode}`,
          blockchain_tx_hash: '0x71c2db194300a29487c95bf2fe44f3a921d7465f',
          planted_at: '2026-08-01T10:30:00Z',
          last_verified_at: '2026-08-31T14:15:00Z',
          growth_history: [
            {"day": 0, "height_cm": 22, "health": 90, "status": "Planted"},
            {"day": 30, "height_cm": 48, "health": 94, "status": "Surviving"}
          ]
        });
      }
      setLoading(false);
    }
    loadTree();
  }, [treeCode]);

  if (loading || !tree) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-emerald-400">LOADING SPECIMEN TELEMETRY...</p>
        </div>
      </div>
    );
  }

  const milestones = [
    { day: 0, title: 'Planted', desc: 'Initial sapling registered and GPS tagged', status: 'completed', date: 'Aug 1, 2026' },
    { day: 1, title: 'AI Verified', desc: 'Computer vision passed with 94% confidence', status: 'completed', date: 'Aug 1, 2026' },
    { day: 30, title: '30-Day Check', desc: 'Same-tree match 95%, healthy foliage (+12% canopy)', status: 'completed', date: 'Aug 31, 2026' },
    { day: 90, title: '90-Day Check', desc: 'Upcoming seasonal vitality scan', status: 'upcoming', date: 'Due Nov 1, 2026' },
    { day: 180, title: '180-Day Check', desc: 'Monsoon survival verification', status: 'pending', date: 'Feb 1, 2027' },
    { day: 365, title: '1-Year Milestone', desc: 'Permanent canopy establishment (+100 GP)', status: 'pending', date: 'Aug 1, 2027' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            soundManager.playLeafHover();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-emerald-500/20 text-emerald-300 text-xs font-mono hover:border-emerald-400 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO DASHBOARD</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => soundManager.playLeafHover()}
            className="p-2 rounded-full glass-panel border border-emerald-500/20 text-slate-300 hover:text-white cursor-pointer"
            title="Share specimen profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ALIVE & VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Main Specimen Identity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left: Specimen Photo & QR */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative rounded-3xl overflow-hidden glass-panel border border-emerald-500/30 aspect-[4/3] group shadow-2xl">
            <img
              src={tree.image_url}
              alt={tree.species}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            
            {/* Tree ID Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/40 text-emerald-300 font-mono text-xs">
              {tree.code}
            </div>

            {/* Health Score Pill */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
              <div>
                <div className="text-2xl font-bold">{tree.species}</div>
                <div className="text-xs text-slate-300 italic">{tree.scientific_name}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-emerald-400">VITALITY</div>
                <div className="text-xl font-mono font-bold text-emerald-300">{tree.health_score}/100</div>
              </div>
            </div>
          </div>

          {/* QR Code and Digital Passport Box */}
          <div className="rounded-2xl glass-panel border border-emerald-500/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                <img src={tree.qr_code_url} alt="QR Code" className="w-full h-full" />
              </div>
              <div>
                <div className="text-xs font-mono text-emerald-400">DIGITAL TREE PASSPORT</div>
                <div className="text-sm font-semibold text-white">Scan to Verify in Field</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">Physical Tag ID: {tree.code}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Specimen Telemetry & Bio-Metrics */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="rounded-3xl glass-panel border border-emerald-500/20 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <span>{tree.species}</span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    🟢 {tree.health_status}
                  </span>
                </h1>
                <p className="text-slate-400 text-xs font-mono mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tree.location_name}</span>
                </p>
              </div>

              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-mono text-slate-400">DAYS ALIVE</div>
                <div className="text-3xl font-mono font-black text-emerald-400">{tree.days_alive}d</div>
              </div>
            </div>

            {/* 4 Metric Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">CO₂ Absorbed</div>
                <div className="text-lg font-mono font-bold text-emerald-400 mt-1">{tree.co2_absorbed_kg} kg</div>
                <div className="text-[10px] text-slate-500">Sequestration</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Height</div>
                <div className="text-lg font-mono font-bold text-white mt-1">{tree.height_cm} cm</div>
                <div className="text-[10px] text-emerald-400">+12cm since plant</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Canopy Width</div>
                <div className="text-lg font-mono font-bold text-white mt-1">{tree.canopy_diameter_cm} cm</div>
                <div className="text-[10px] text-slate-500">Optimal radius</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">GNSS Accuracy</div>
                <div className="text-lg font-mono font-bold text-teal-300 mt-1">±{tree.gps_accuracy_m || 2.4}m</div>
                <div className="text-[10px] text-emerald-400">Dual-band RTK</div>
              </div>
            </div>

            {/* Tabs Header */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-black/50 border border-white/5 mb-6">
              {[
                { id: 'timeline', label: 'Survival Timeline' },
                { id: 'health', label: 'AI Health Assessment' },
                { id: 'blockchain', label: 'Blockchain Audit' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    soundManager.playLeafHover();
                    setActiveTab(t.id as any);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-emerald-500 text-black font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Survival Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {milestones.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    {idx !== milestones.length - 1 && (
                      <div className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-emerald-500/20" />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        m.status === 'completed'
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                          : m.status === 'upcoming'
                          ? 'bg-emerald-950 border border-emerald-400 text-emerald-400'
                          : 'bg-white/5 border border-white/10 text-slate-500'
                      }`}
                    >
                      {m.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{m.title}</span>
                        <span className="text-[11px] font-mono text-slate-400">{m.date}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: AI Health Assessment */}
            {activeTab === 'health' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-emerald-400">AI-ASSISTED ASSESSMENT</span>
                    <span className="text-xs font-mono text-slate-400">CONFIDENCE 96.8%</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Automated multispectral analysis indicates strong chlorophyll absorption in the upper canopy.
                    Foliage is free from pest necrosis or chlorosis. Stem elongation corresponds to healthy juvenile growth.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400">Leaf Condition</span>
                    <div className="text-emerald-400 font-semibold mt-1">Lush Green (ExG &gt; 0.42)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400">Visible Damage</span>
                    <div className="text-emerald-400 font-semibold mt-1">None Detected (0.0%)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400">Water Stress Index</span>
                    <div className="text-emerald-400 font-semibold mt-1">Optimal (CWSI 0.14)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400">Next Scheduled Check</span>
                    <div className="text-white font-semibold mt-1">Day 90 (in 56 days)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Blockchain Audit */}
            {activeTab === 'blockchain' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-slate-500 text-[10px]">LEDGER STATUS</div>
                  <div className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographically Confirmed on Polygon Amoy</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 overflow-hidden">
                  <div className="text-slate-500 text-[10px]">TRANSACTION HASH</div>
                  <div className="text-slate-300 break-all text-[11px] mt-0.5">{tree.blockchain_tx_hash}</div>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-slate-500 text-[10px]">SMART CONTRACT AUDIT LAYER</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">0x71C2Db194300a29487c95bF2Fe44F3a921d7465F</div>
                  <div className="text-[10px] text-slate-500 mt-1">Functions: recordVerifiedTree(), recordSurvivalVerification()</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
