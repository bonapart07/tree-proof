'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasWrapper from '../3d/CanvasWrapper';
import TreeProfileScene from '../3d/TreeProfileScene';
import { soundManager } from '@/lib/sound';
import { api } from '@/lib/api';
import {
  MapPin,
  Search,
  Filter,
  Layers,
  X,
  ShieldCheck,
  Calendar,
  Compass,
  ArrowRight,
  Flame,
  Grid,
  CheckCircle2
} from 'lucide-react';

interface MapViewProps {
  onSelectTree?: (code: string) => void;
  onNavigate?: (view: string, data?: any) => void;
}

const DISTRICT_LIST = [
  'All Districts',
  'Kamrup Metro (Assam)',
  'Sonitpur (Assam)',
  'Jorhat (Assam)',
  'Pune (Maharashtra)',
  'Wayanad (Kerala)',
  'South 24 Parganas (Sundarbans)',
  'Gurugram (Aravalli)',
];

export default function MapView({ onSelectTree, onNavigate }: MapViewProps) {
  const [trees, setTrees] = useState<any[]>([]);
  const [selectedTree, setSelectedTree] = useState<any | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('All Districts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMapTrees() {
      setLoading(true);
      const data = await api.getTrees('all', 'all', 'all', '');
      if (data && data.length > 0) {
        setTrees(data);
        setSelectedTree(data[0]);
      } else {
        // Fallback realistic geo trees across India
        const mockMapTrees = [
          { code: 'TREE-AS-000001', species: 'Neem', scientific_name: 'Azadirachta indica', location_name: 'Guwahati Bio-Reserve', district: 'Kamrup Metro', state: 'Assam', latitude: 26.1445, longitude: 91.7362, health_status: 'Healthy', health_score: 94, planted_at: '2026-08-01', days_alive: 34, co2_absorbed_kg: 2.7 },
          { code: 'TREE-AS-000002', species: 'Banyan', scientific_name: 'Ficus benghalensis', location_name: 'Nameri Foothills', district: 'Sonitpur', state: 'Assam', latitude: 26.6528, longitude: 92.7926, health_status: 'Healthy', health_score: 91, planted_at: '2026-07-01', days_alive: 62, co2_absorbed_kg: 5.4 },
          { code: 'TREE-AS-000003', species: 'Teak', scientific_name: 'Tectona grandis', location_name: 'Brahmaputra Floodplain', district: 'Jorhat', state: 'Assam', latitude: 26.7509, longitude: 94.2037, health_status: 'Needs Attention', health_score: 72, planted_at: '2026-08-04', days_alive: 28, co2_absorbed_kg: 2.1 },
          { code: 'TREE-MH-000014', species: 'Mango', scientific_name: 'Mangifera indica', location_name: 'Western Ghats Ridge', district: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567, health_status: 'Healthy', health_score: 96, planted_at: '2026-06-15', days_alive: 78, co2_absorbed_kg: 6.8 },
          { code: 'TREE-KL-000022', species: 'Bamboo', scientific_name: 'Bambusa vulgaris', location_name: 'Nilgiri Biosphere Buffer', district: 'Wayanad', state: 'Kerala', latitude: 11.6854, longitude: 76.1320, health_status: 'Healthy', health_score: 98, planted_at: '2026-05-10', days_alive: 114, co2_absorbed_kg: 9.2 },
          { code: 'TREE-WB-000035', species: 'Sundari', scientific_name: 'Heritiera fomes', location_name: 'Sundarbans Delta Zone', district: 'South 24 Parganas', state: 'West Bengal', latitude: 21.9497, longitude: 89.1833, health_status: 'Needs Attention', health_score: 68, planted_at: '2026-07-20', days_alive: 43, co2_absorbed_kg: 3.5 },
          { code: 'TREE-HR-000048', species: 'Khejri', scientific_name: 'Prosopis cineraria', location_name: 'Aravalli Biodiversity Wall', district: 'Gurugram', state: 'Haryana', latitude: 28.4595, longitude: 77.0266, health_status: 'Critical', health_score: 48, planted_at: '2026-08-10', days_alive: 22, co2_absorbed_kg: 1.4 },
          { code: 'TREE-AS-000052', species: 'Sal', scientific_name: 'Shorea robusta', location_name: 'Kaziranga Buffer', district: 'Sonitpur', state: 'Assam', latitude: 26.6800, longitude: 92.8100, health_status: 'Dead', health_score: 12, planted_at: '2026-07-15', days_alive: 18, co2_absorbed_kg: 0.8 },
        ];
        setTrees(mockMapTrees);
        setSelectedTree(mockMapTrees[0]);
      }
      setLoading(false);
    }
    loadMapTrees();
  }, []);

  const filteredTrees = trees.filter((tree) => {
    const matchesSpecies = speciesFilter === 'all' || tree.species.toLowerCase() === speciesFilter.toLowerCase();
    const matchesHealth = healthFilter === 'all' || tree.health_status.toLowerCase() === healthFilter.toLowerCase();
    const matchesDistrict = districtFilter === 'All Districts' || tree.district.toLowerCase().includes(districtFilter.split(' ')[0].toLowerCase());
    const matchesQuery =
      tree.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.species.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecies && matchesHealth && matchesDistrict && matchesQuery;
  });

  const getHealthMarkerColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-emerald-400 border-emerald-300 shadow-emerald-400/50';
      case 'Needs Attention': return 'bg-amber-400 border-amber-300 shadow-amber-400/50';
      case 'Critical': return 'bg-rose-500 border-rose-400 shadow-rose-500/50';
      case 'Dead': return 'bg-slate-700 border-slate-500 shadow-slate-700/50';
      default: return 'bg-emerald-400 border-emerald-300 shadow-emerald-400/50';
    }
  };

  const handlePinClick = (tree: any) => {
    soundManager.playLeafHover();
    setSelectedTree(tree);
  };

  return (
    <div className="relative min-h-screen pt-28 pb-16 px-4 max-w-7xl mx-auto flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-3">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>GEOSPATIAL BIOMASS & SURVIVAL ATLAS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-mint">Plantation Map</span>
          </h1>
        </div>

        {/* Mode Toggle & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Heatmap Toggle */}
          <button
            onClick={() => {
              soundManager.playLeafHover();
              setIsHeatmapMode(!isHeatmapMode);
            }}
            className={`px-4 py-2 rounded-full text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
              isHeatmapMode
                ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/30'
                : 'glass-card border border-emerald-500/20 text-emerald-300 hover:border-emerald-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isHeatmapMode ? 'HEATMAP ON' : 'HEATMAP MODE'}</span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Tree ID or locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full glass-card border border-emerald-500/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 w-44 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Multi-Filters Bar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6 p-3 rounded-2xl glass-panel border border-emerald-500/20 text-xs">
        <span className="text-slate-400 font-mono flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>

        {/* Species Filter */}
        <select
          value={speciesFilter}
          onChange={(e) => setSpeciesFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-slate-300 focus:border-emerald-400 outline-none cursor-pointer"
        >
          <option value="all">All Species</option>
          <option value="neem">Neem</option>
          <option value="banyan">Banyan</option>
          <option value="teak">Teak</option>
          <option value="mango">Mango</option>
          <option value="bamboo">Bamboo</option>
          <option value="sal">Sal</option>
          <option value="sundari">Sundari</option>
          <option value="khejri">Khejri</option>
        </select>

        {/* Health Filter */}
        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-slate-300 focus:border-emerald-400 outline-none cursor-pointer"
        >
          <option value="all">All Health States</option>
          <option value="healthy">🟢 Healthy</option>
          <option value="needs attention">🟡 Needs Attention</option>
          <option value="critical">🔴 Critical</option>
          <option value="dead">⚫ Dead</option>
        </select>

        {/* District Filter */}
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-slate-300 focus:border-emerald-400 outline-none cursor-pointer"
        >
          {DISTRICT_LIST.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Legend Pills */}
        <div className="ml-auto flex items-center gap-3 font-mono text-[11px] hidden lg:flex">
          <span className="flex items-center gap-1 text-emerald-300"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Healthy</span>
          <span className="flex items-center gap-1 text-amber-300"><span className="w-2 h-2 rounded-full bg-amber-400" /> Needs Attention</span>
          <span className="flex items-center gap-1 text-rose-300"><span className="w-2 h-2 rounded-full bg-rose-500" /> Critical</span>
          <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-600" /> Dead</span>
        </div>
      </div>

      {/* Main Map Visual Canvas */}
      <div className="relative flex-1 min-h-[580px] rounded-3xl glass-panel border border-emerald-500/25 overflow-hidden shadow-2xl flex">
        {/* Subtle Map Grid / Topographic Background */}
        <div className="absolute inset-0 bg-[#040e08] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />

        {/* Heatmap Layer Simulation */}
        {isHeatmapMode && (
          <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen bg-[radial-gradient(ellipse_at_70%_40%,rgba(16,185,129,0.5)_0%,transparent_40%),radial-gradient(ellipse_at_35%_65%,rgba(245,158,11,0.4)_0%,transparent_35%),radial-gradient(ellipse_at_50%_30%,rgba(52,211,153,0.5)_0%,transparent_45%)]" />
        )}

        {/* Top telemetry status */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>INDIAN REFORESTATION CORRIDOR • {filteredTrees.length} PINNED SPECIMENS</span>
          </div>
        </div>

        {/* Interactive Pins Overlay */}
        <div className="absolute inset-0 z-10 p-12 overflow-hidden">
          {filteredTrees.map((tree, idx) => {
            // Map coordinate distribution across the viewport
            // Latitude range ~11 to 29 (Y inversion), Longitude range ~73 to 95 (X)
            const minLat = 10.0;
            const maxLat = 30.0;
            const minLng = 72.0;
            const maxLng = 95.0;

            const xPct = Math.min(92, Math.max(8, ((tree.longitude - minLng) / (maxLng - minLng)) * 85 + 6));
            const yPct = Math.min(90, Math.max(10, 100 - (((tree.latitude - minLat) / (maxLat - minLat)) * 80 + 10)));

            const isSelected = selectedTree?.code === tree.code;

            return (
              <motion.button
                key={tree.code || idx}
                onClick={() => handlePinClick(tree)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.35 }}
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer focus:outline-none`}
              >
                {/* Outer Glow Halo */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-lg transition-all ${
                    getHealthMarkerColor(tree.health_status)
                  } ${isSelected ? 'scale-125 ring-4 ring-white/40' : 'opacity-90'}`}
                >
                  <div className="w-2 h-2 rounded-full bg-black" />
                </div>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                  <div className="px-3 py-1.5 rounded-xl bg-black/90 border border-emerald-500/40 text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                    <span className="text-emerald-400 font-bold">{tree.code}</span> • {tree.species} ({tree.health_status})
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Specimen Inspection Drawer */}
        <AnimatePresence>
          {selectedTree && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full sm:w-96 z-30 p-6 glass-panel border-l border-emerald-500/30 bg-[#060c08]/95 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-emerald-400">SPECIMEN INSPECTION</span>
                  <button
                    onClick={() => setSelectedTree(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 3D Model Scene Preview */}
                <div className="w-full h-44 rounded-2xl glass-card border border-emerald-500/20 overflow-hidden mb-4 relative bg-black/40">
                  <CanvasWrapper camera={{ position: [0, 1.2, 3.2], fov: 45 }}>
                    <TreeProfileScene tree={selectedTree} growthDay={selectedTree.days_alive || 30} />
                  </CanvasWrapper>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-emerald-400">
                    DIGITAL TWIN 3D PREVIEW
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white font-sans">{selectedTree.species}</h3>
                    <p className="text-slate-400 text-xs italic">{selectedTree.scientific_name}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tree ID:</span>
                      <span className="text-emerald-400 font-bold">{selectedTree.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Health State:</span>
                      <span className="text-white font-semibold">
                        {selectedTree.health_status === 'Healthy' ? '🟢 Healthy' : '🟡 ' + selectedTree.health_status} ({selectedTree.health_score || 94}/100)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Days Alive:</span>
                      <span className="text-white">{selectedTree.days_alive || 34} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Coordinates:</span>
                      <span className="text-slate-300">{selectedTree.latitude}° N, {selectedTree.longitude}° E</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">District:</span>
                      <span className="text-slate-300">{selectedTree.district}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Full Tree Details Page Button */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    soundManager.playRewardBurst();
                    if (onSelectTree) onSelectTree(selectedTree.code);
                    if (onNavigate) onNavigate('tree-detail', { code: selectedTree.code });
                  }}
                  className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <span>Open Full Tree Passport</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
