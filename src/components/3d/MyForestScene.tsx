'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TreeData, TreeHealth } from '@/types';
import { soundManager } from '@/lib/sound';

interface MyForestSceneProps {
  trees: TreeData[];
  selectedTreeId?: string;
  onSelectTree: (tree: TreeData) => void;
}

// Tree color mapping by health status
const HEALTH_COLORS: Record<TreeHealth, { canopy: string; emissive?: string; roughness: number }> = {
  healthy: { canopy: '#10b981', emissive: '#059669', roughness: 0.3 },
  moderate: { canopy: '#eab308', emissive: '#ca8a04', roughness: 0.4 },
  critical: { canopy: '#f97316', emissive: '#ea580c', roughness: 0.6 },
  dead: { canopy: '#78716c', emissive: '#44403c', roughness: 0.9 },
};

function MiniatureTree({
  tree,
  position,
  isSelected,
  onClick,
}: {
  tree: TreeData;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null);
  const healthStyle = HEALTH_COLORS[tree.status];

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      // Gentle wind sway
      meshRef.current.rotation.z = Math.sin(t * 1.5 + position[0]) * 0.03;
      if (hovered) {
        meshRef.current.scale.setScalar(1.1);
      } else {
        meshRef.current.scale.setScalar(1.0);
      }
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        soundManager.playLeafHover();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Ground marker disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, isSelected ? 0.65 : 0.4, 32]} />
        <meshBasicMaterial
          color={isSelected ? '#34d399' : hovered ? '#10b981' : '#064e3b'}
          transparent
          opacity={isSelected ? 0.9 : 0.4}
        />
      </mesh>

      {/* Trunk */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.07, 0.14, 1.2, 12]} />
        <meshStandardMaterial color={tree.status === 'dead' ? '#57534e' : '#452b1a'} roughness={0.9} />
      </mesh>

      {/* Canopy (omitted or withered if dead) */}
      {tree.status !== 'dead' ? (
        <group position={[0, 1.4, 0]}>
          <mesh>
            <dodecahedronGeometry args={[0.65, 1]} />
            <meshStandardMaterial
              color={healthStyle.canopy}
              emissive={healthStyle.emissive}
              emissiveIntensity={isSelected ? 0.4 : 0.15}
              roughness={healthStyle.roughness}
            />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <dodecahedronGeometry args={[0.45, 1]} />
            <meshStandardMaterial
              color={healthStyle.canopy}
              roughness={healthStyle.roughness}
            />
          </mesh>
        </group>
      ) : (
        /* Bare withered branches */
        <group position={[0, 1.2, 0]}>
          <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, -0.6]}>
            <cylinderGeometry args={[0.03, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#57534e" />
          </mesh>
          <mesh position={[-0.2, 0.2, 0]} rotation={[0, 0, 0.6]}>
            <cylinderGeometry args={[0.03, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#57534e" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function MyForestScene({
  trees,
  selectedTreeId,
  onSelectTree,
}: MyForestSceneProps) {
  // Compute circular arrangement
  const positions: [number, number, number][] = trees.map((_, i) => {
    const angle = (i / trees.length) * Math.PI * 2;
    const r = 2.8 + (i % 2) * 0.8;
    return [Math.cos(angle) * r, 0, Math.sin(angle) * r];
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 6]} intensity={1.8} color="#f0fdf4" castShadow />
      <pointLight position={[0, 5, 0]} intensity={1.5} color="#34d399" distance={10} />

      {/* Forest glade island base */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.8, 64]} />
        <meshStandardMaterial color="#051c12" roughness={0.85} />
      </mesh>
      {/* Outer ambient glow ring */}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 5.2, 64]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
      </mesh>

      {/* Render all user trees */}
      {trees.map((tree, i) => (
        <MiniatureTree
          key={tree.id}
          tree={tree}
          position={positions[i]}
          isSelected={tree.id === selectedTreeId}
          onClick={() => onSelectTree(tree)}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        maxDistance={12}
        minDistance={4}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}
