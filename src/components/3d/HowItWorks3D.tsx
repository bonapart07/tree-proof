'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import CanvasWrapper from './CanvasWrapper';
import { soundManager } from '@/lib/sound';
import { ArrowRight, ShieldCheck, Sprout, Sparkles, Trees } from 'lucide-react';

// --- Embedded Mini 3D Scenes ---

function PlantMiniScene({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (isHovered ? 2.0 : 0.8);
      groupRef.current.position.y = Math.sin(_.clock.getElapsedTime() * 2) * 0.08;
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 2]} intensity={1.5} color="#ecfdf5" />
      <pointLight position={[0, 0, 1]} intensity={1.2} color="#34d399" />
      <group ref={groupRef} position={[0, -0.4, 0]}>
        {/* Soil mound */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.9, 0.25, 16]} />
          <meshStandardMaterial color="#2d1e12" roughness={0.9} />
        </mesh>
        {/* Sprout stem */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.04, 0.07, 0.7, 12]} />
          <meshStandardMaterial color="#22c55e" roughness={0.3} />
        </mesh>
        {/* Twin leaves */}
        <mesh position={[0.2, 0.8, 0]} rotation={[0.4, 0, -0.7]}>
          <boxGeometry args={[0.3, 0.02, 0.2]} />
          <meshStandardMaterial color="#4ade80" />
        </mesh>
        <mesh position={[-0.2, 0.8, 0]} rotation={[-0.4, 0, 0.7]}>
          <boxGeometry args={[0.3, 0.02, 0.2]} />
          <meshStandardMaterial color="#34d399" />
        </mesh>
      </group>
    </>
  );
}

function ProveMiniScene({ isHovered }: { isHovered: boolean }) {
  const leafRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (leafRef.current) leafRef.current.rotation.y += delta * (isHovered ? 2.5 : 1.0);
    if (ring1Ref.current) ring1Ref.current.rotation.x += delta * 1.5;
    if (ring2Ref.current) ring2Ref.current.rotation.y += delta * 1.8;
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 2, 2]} intensity={2.0} color="#10b981" />
      <group position={[0, 0, 0]}>
        {/* 3D Leaf */}
        <mesh ref={leafRef}>
          <octahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial color="#10b981" roughness={0.2} metalness={0.2} />
        </mesh>
        {/* Hologram AI Scanning Rings */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[1.05, 0.02, 16, 64]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
        <mesh ref={ring2Ref} rotation={[-Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.2, 0.015, 16, 64]} />
          <meshBasicMaterial color="#6ee7b7" />
        </mesh>
      </group>
    </>
  );
}

function ProtectMiniScene({ isHovered }: { isHovered: boolean }) {
  const treeRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (treeRef.current) {
      treeRef.current.rotation.y += delta * (isHovered ? 1.8 : 0.6);
      treeRef.current.scale.setScalar(1 + (isHovered ? 0.08 : 0));
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 2]} intensity={1.5} color="#ecfdf5" />
      <group ref={treeRef} position={[0, -0.6, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.1, 0.2, 1.2, 12]} />
          <meshStandardMaterial color="#3d2817" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <dodecahedronGeometry args={[0.75, 1]} />
          <meshStandardMaterial color="#10b981" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <dodecahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color="#34d399" roughness={0.3} />
        </mesh>
      </group>
    </>
  );
}

function RewardMiniScene({ isHovered }: { isHovered: boolean }) {
  const crystalRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * (isHovered ? 3.0 : 1.2);
      crystalRef.current.rotation.x += delta * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[2, 2, 2]} intensity={2.5} color="#34d399" />
      <group position={[0, 0, 0]}>
        <mesh ref={crystalRef}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color="#059669"
            emissive="#10b981"
            emissiveIntensity={isHovered ? 0.6 : 0.3}
            roughness={0.1}
            metalness={0.6}
          />
        </mesh>
      </group>
    </>
  );
}

const CARDS_DATA = [
  {
    step: '01',
    title: 'PLANT',
    subtitle: 'Nursery & Geo-Tag',
    desc: 'Plant a native species sapling. Capture high-accuracy GPS coordinates with anti-spoofing cryptographic validation.',
    icon: Sprout,
    accent: '#22c55e',
    scene: PlantMiniScene,
  },
  {
    step: '02',
    title: 'PROVE',
    subtitle: 'Dual AI Verification',
    desc: 'Continuous AI computer vision cross-matches canopy chlorophyll index, stem calipers, and satellite multispectral passes.',
    icon: ShieldCheck,
    accent: '#10b981',
    scene: ProveMiniScene,
  },
  {
    step: '03',
    title: 'PROTECT',
    subtitle: 'Survival Monitoring',
    desc: 'Monitor health milestones at Day 30, 90, 180, and 365. Automated survival tracking prevents premature death or falsified logs.',
    icon: Trees,
    accent: '#34d399',
    scene: ProtectMiniScene,
  },
  {
    step: '04',
    title: 'REWARD',
    subtitle: 'GreenPoints & Carbon Yield',
    desc: 'Earn liquid GreenPoints for each surviving milestone. Redeem for instant cash, eco-goods, or direct reforestation funding.',
    icon: Sparkles,
    accent: '#6ee7b7',
    scene: RewardMiniScene,
  },
];

export default function HowItWorks3D() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="relative py-24 px-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-4 tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          VERIFICATION ARCHITECTURE
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          How <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-mint to-teal-300">GreenProof</span> Operates
        </h2>
        <p className="text-slate-400 text-base sm:text-lg">
          From germinating seed to verified carbon sequestration — an immutable journey powered by 3D spatial intelligence.
        </p>
      </div>

      {/* 4 Interactive 3D Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CARDS_DATA.map((card, idx) => {
          const SceneComponent = card.scene;
          const isHovered = hoveredIdx === idx;

          return (
            <motion.div
              key={card.title}
              onMouseEnter={() => {
                setHoveredIdx(idx);
                soundManager.playLeafHover();
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative rounded-2xl glass-card overflow-hidden p-6 flex flex-col justify-between group cursor-pointer border border-emerald-500/20 hover:border-emerald-400/50"
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-emerald-400/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  STEP {card.step}
                </span>
                <card.icon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>

              {/* Embedded 3D Canvas */}
              <div className="w-full h-44 my-2 relative">
                <CanvasWrapper camera={{ position: [0, 0, 3.2], fov: 45 }}>
                  <SceneComponent isHovered={isHovered} />
                </CanvasWrapper>
              </div>

              {/* Card Meta */}
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-emerald-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs font-mono text-emerald-400/80 mb-2">
                  {card.subtitle}
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {card.desc}
                </p>
              </div>

              {/* Subtle hover pulse line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent mt-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
