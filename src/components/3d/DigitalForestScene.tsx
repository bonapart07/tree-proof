'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface DigitalForestSceneProps {
  treeCount?: number;
  interactive?: boolean;
}

export default function DigitalForestScene({
  treeCount = 120,
  interactive = true,
}: DigitalForestSceneProps) {
  const trunkInstancedRef = useRef<THREE.InstancedMesh>(null);
  const canopyInstancedRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const fogParticlesRef = useRef<THREE.Points>(null);

  // Generate deterministic pseudo-random tree transforms
  const treeData = useMemo(() => {
    const data: {
      position: [number, number, number];
      scale: number;
      rotationY: number;
      color: THREE.Color;
    }[] = [];

    const canopyPalette = [
      new THREE.Color('#059669'), // emerald
      new THREE.Color('#10b981'), // vibrant green
      new THREE.Color('#34d399'), // mint
      new THREE.Color('#047857'), // deep forest
      new THREE.Color('#065f46'), // dark pine
    ];

    for (let i = 0; i < treeCount; i++) {
      // Polar distribution around center clearing
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.pow(Math.random(), 0.6) * 14.0;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.55 + Math.random() * 0.75;
      const rotationY = Math.random() * Math.PI * 2;
      const color = canopyPalette[Math.floor(Math.random() * canopyPalette.length)];

      data.push({
        position: [x, 0, z],
        scale,
        rotationY,
        color,
      });
    }
    return data;
  }, [treeCount]);

  // Set instanced matrices once on mount
  useEffect(() => {
    if (!trunkInstancedRef.current || !canopyInstancedRef.current) return;

    const dummy = new THREE.Object3D();

    treeData.forEach((t, i) => {
      // 1. Trunk transform
      dummy.position.set(t.position[0], t.position[1] + 0.6 * t.scale, t.position[2]);
      dummy.rotation.set(0, t.rotationY, 0);
      dummy.scale.set(t.scale, t.scale, t.scale);
      dummy.updateMatrix();
      trunkInstancedRef.current?.setMatrixAt(i, dummy.matrix);

      // 2. Canopy transform (atop the trunk)
      dummy.position.set(t.position[0], t.position[1] + 1.6 * t.scale, t.position[2]);
      dummy.updateMatrix();
      canopyInstancedRef.current?.setMatrixAt(i, dummy.matrix);
      canopyInstancedRef.current?.setColorAt(i, t.color);
    });

    trunkInstancedRef.current.instanceMatrix.needsUpdate = true;
    canopyInstancedRef.current.instanceMatrix.needsUpdate = true;
    if (canopyInstancedRef.current.instanceColor) {
      canopyInstancedRef.current.instanceColor.needsUpdate = true;
    }
  }, [treeData]);

  // Forest mist particles
  const mistPositions = useMemo(() => {
    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 16;
      positions[i * 3] = Math.cos(angle) * dist;
      positions[i * 3 + 1] = 0.2 + Math.random() * 2.5;
      positions[i * 3 + 2] = Math.sin(angle) * dist;
    }
    return positions;
  }, []);

  // Frame animation for wind sway and mist drift
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.02; // slow cinematic orbital drift
    }
    if (fogParticlesRef.current) {
      fogParticlesRef.current.rotation.y = -t * 0.015;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.6}
        color="#e6fffa"
        castShadow
      />
      <pointLight position={[0, 4, 0]} intensity={1.2} color="#34d399" distance={15} />

      {/* Atmospheric depth fog */}
      <fog attach="fog" args={['#060a08', 8, 25]} />

      <group ref={groupRef}>
        {/* Ground Biosphere Disc */}
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[18, 48]} />
          <meshStandardMaterial
            color="#04180f"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>

        {/* Instanced Trunks: 1 single drawcall */}
        <instancedMesh
          ref={trunkInstancedRef}
          args={[undefined, undefined, treeCount]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.08, 0.16, 1.2, 8]} />
          <meshStandardMaterial color="#3b2b1e" roughness={0.9} />
        </instancedMesh>

        {/* Instanced Canopies: 1 single drawcall */}
        <instancedMesh
          ref={canopyInstancedRef}
          args={[undefined, undefined, treeCount]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial roughness={0.4} metalness={0.1} />
        </instancedMesh>

        {/* Swirling forest canopy spores / mist */}
        <points ref={fogParticlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[mistPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.12}
            color="#34d399"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      {interactive && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 3.5}
          autoRotate={false}
        />
      )}
    </>
  );
}
