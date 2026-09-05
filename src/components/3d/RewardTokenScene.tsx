'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createLeafGeometry } from '@/lib/three-utils';

interface RewardTokenSceneProps {
  isBursting?: boolean;
}

export default function RewardTokenScene({ isBursting = false }: RewardTokenSceneProps) {
  const tokenGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const burstParticlesRef = useRef<THREE.Points>(null);

  const leafGeom = useMemo(() => createLeafGeometry(1.6, 0.8, 16, 24), []);

  // Burst particle field
  const [particlePositions, particleVelocities] = useMemo(() => {
    const count = 90;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.0;
      vel[i * 3] = Math.cos(angle) * speed;
      vel[i * 3 + 1] = (Math.random() - 0.2) * speed;
      vel[i * 3 + 2] = Math.sin(angle) * speed;
    }
    return [pos, vel];
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (tokenGroupRef.current) {
      tokenGroupRef.current.rotation.y += delta * 1.4;
      tokenGroupRef.current.position.y = Math.sin(t * 2) * 0.12;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.8;
      ringRef.current.rotation.x = Math.sin(t) * 0.2;
    }

    if (burstParticlesRef.current && isBursting) {
      const positions = burstParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particlePositions.length / 3; i++) {
        positions[i * 3] += particleVelocities[i * 3] * delta * 1.5;
        positions[i * 3 + 1] += particleVelocities[i * 3 + 1] * delta * 1.5;
        positions[i * 3 + 2] += particleVelocities[i * 3 + 2] * delta * 1.5;
      }
      burstParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 3, 3]} intensity={2.5} color="#34d399" />
      <pointLight position={[-3, -2, -2]} intensity={1.5} color="#10b981" />

      {/* Floating 3D Token */}
      <group ref={tokenGroupRef}>
        {/* Central Emerald Leaf */}
        <mesh geometry={leafGeom} castShadow>
          <meshStandardMaterial
            color="#059669"
            emissive="#10b981"
            emissiveIntensity={0.5}
            roughness={0.15}
            metalness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Orbiting Golden Halo Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.25, 0.025, 16, 64]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Central gem core */}
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#6ee7b7" emissive="#34d399" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Burst Particles on Claim */}
      {isBursting && (
        <points ref={burstParticlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.14}
            color="#6ee7b7"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </>
  );
}
