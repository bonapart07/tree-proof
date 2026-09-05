'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Trees,
  UploadCloud,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Plus,
  Sparkles,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface NgoDashboardViewProps {
  onNavigate: (view: string) => void;
}

export default function NgoDashboardView({ onNavigate }: NgoDashboardViewProps) {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSpecies, setBulkSpecies] = useState('Neem');
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkDistrict, setBulkDistrict] = useState('Sonitpur, Assam');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleBulkSubmit = () => {
    setIsRegistering(true);
    soundManager.playRewardBurst();
    setTimeout(() => {
      setIsRegistering(false);
      setRegisteredSuccess(true);
      setTimeout(() => {
        setRegisteredSuccess(false);
        setShowBulkModal(false);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-7xl mx-auto">
      {/* NGO Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-bold shrink-0">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Aranya Wildlife & Reforestation Trust
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
                VERIFIED NGO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              REG: NGO-AS-2018-9941 • ASSAM ECO-CORRIDOR SECTOR
            </p>
          </div>
        </div>

        {/* Action Button: Bulk Registration */}
        <button
          onClick={() => {
            soundManager.playLeafHover();
            setShowBulkModal(true);
          }}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 hover:scale-105 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Batch / Bulk Tree Registration</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl glass-panel border border-emerald-500/20 shadow-xl">
          <div className="text-xs font-mono text-slate-400 uppercase mb-2">MANAGED PLANTATIONS</div>
          <div className="text-3xl font-bold font-mono text-white mb-1">1,840</div>
          <div className="text-xs text-emerald-400 font-medium">100% geotagged</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-emerald-500/40 bg-emerald-950/20 shadow-xl">
          <div className="text-xs font-mono text-emerald-300 uppercase mb-2">VERIFIED SURVIVAL RATE</div>
          <div className="text-3xl font-bold font-mono text-emerald-400 mb-1">92.4%</div>
          <div className="text-xs text-slate-400">1,700 surviving trees</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-emerald-500/20 shadow-xl">
          <div className="text-xs font-mono text-slate-400 uppercase mb-2">ACTIVE FIELD RANGERS</div>
          <div className="text-3xl font-bold font-mono text-white mb-1">48</div>
          <div className="text-xs text-slate-400">Volunteers & botanists</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-emerald-500/20 shadow-xl">
          <div className="text-xs font-mono text-slate-400 uppercase mb-2">COMMUNITY REWARD POOL</div>
          <div className="text-3xl font-bold font-mono text-teal-300 mb-1">48,200 GP</div>
          <div className="text-xs text-slate-400">Distributed to local planters</div>
        </div>
      </div>

      {/* Active Campaigns & Community Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Campaigns */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl glass-panel border border-emerald-500/20 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Active Reforestation Corridors</h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Project Green Horizon 2026',
                  region: 'Nameri Foothills Corridor, Sonitpur',
                  target: 5000,
                  planted: 4200,
                  surviving: 3890,
                  rate: '92.6%',
                  sponsor: 'Tata CleanTech'
                },
                {
                  title: 'Brahmaputra Riparian Buffer Wall',
                  region: 'Jorhat Floodplain Zone',
                  target: 3000,
                  planted: 2100,
                  surviving: 1940,
                  rate: '92.3%',
                  sponsor: 'Mahindra EcoDrive'
                }
              ].map((c, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{c.title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{c.region}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                      Sponsor: {c.sponsor}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Progress: {c.planted} / {c.target} trees</span>
                      <span className="text-emerald-400">{c.rate} Surviving</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${(c.planted / c.target) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assigned Field Activities */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl glass-panel border border-emerald-500/20 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Pending Field Inspections</h3>
            <div className="space-y-3">
              {[
                { batch: 'Batch #441 - Sonitpur', count: '45 Trees', task: 'Day 30 Survival Check', due: 'Tomorrow' },
                { batch: 'Batch #412 - Nameri', count: '120 Trees', task: 'Day 90 Canopy Metric', due: 'In 4 days' },
                { batch: 'Batch #389 - Jorhat', count: '80 Trees', task: 'Flood Resilience Check', due: 'In 7 days' },
              ].map((task, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">{task.batch}</div>
                    <div className="text-[11px] text-slate-400">{task.task} • {task.count}</div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">
                    {task.due}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Plantation Registration Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl glass-panel border border-emerald-500/30 p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Bulk Plantation Registration</h3>
            <p className="text-xs text-slate-400 mb-6">
              Register an entire batch of saplings tagged by GPS coordinates or CSV telemetry.
            </p>

            {registeredSuccess ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                <div className="text-lg font-bold text-white">Batch Registered & Geotagged!</div>
                <div className="text-xs font-mono text-emerald-400">{bulkCount} New Trees assigned to Aranya Trust</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Select Species</label>
                  <select
                    value={bulkSpecies}
                    onChange={(e) => setBulkSpecies(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:border-emerald-400 outline-none"
                  >
                    <option value="Neem">Neem (Azadirachta indica)</option>
                    <option value="Banyan">Banyan (Ficus benghalensis)</option>
                    <option value="Teak">Teak (Tectona grandis)</option>
                    <option value="Bamboo">Bamboo (Bambusa vulgaris)</option>
                    <option value="Sal">Sal (Shorea robusta)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Batch Count</label>
                    <input
                      type="number"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                      className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:border-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Target District</label>
                    <input
                      type="text"
                      value={bulkDistrict}
                      onChange={(e) => setBulkDistrict(e.target.value)}
                      className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:border-emerald-400 outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-950/20 text-center">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-white">Upload GPS Coordinates CSV (Optional)</div>
                  <div className="text-[10px] text-slate-400 mt-1">Columns: lat, lng, sapling_tag_id</div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 rounded-full glass-panel text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkSubmit}
                    disabled={isRegistering}
                    className="px-6 py-2 rounded-full bg-emerald-500 text-black font-bold text-xs font-mono cursor-pointer hover:bg-emerald-400 transition-colors"
                  >
                    {isRegistering ? 'Registering...' : `Confirm Registration (${bulkCount} Trees)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
