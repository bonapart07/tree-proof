'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createLeafGeometry } from '@/lib/three-utils';

interface SingleLeafProps {
  initialPos: [number, number, number];
  scale: number;
  speed: number;
  rotSpeed: [number, number, number];
}

export function FloatingLeaf({
  initialPos,
  scale = 0.5,
  speed = 1.0,
  rotSpeed = [0.2, 0.3, 0.1],
}: SingleLeafProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => createLeafGeometry(1.5, 0.7, 12, 16), []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime() * speed;
      meshRef.current.position.y = initialPos[1] + Math.sin(t + initialPos[0]) * 0.4;
      meshRef.current.position.x = initialPos[0] + Math.cos(t * 0.7 + initialPos[2]) * 0.3;
      meshRef.current.rotation.x += rotSpeed[0] * 0.01;
      meshRef.current.rotation.y += rotSpeed[1] * 0.015;
      meshRef.current.rotation.z = Math.sin(t) * 0.2;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geom}
      position={initialPos}
      scale={[scale, scale, scale]}
    >
      <meshStandardMaterial
        color="#10b981"
        roughness={0.3}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function FloatingLeavesBackground({ count = 8 }: { count?: number }) {
  const leavesData = useMemo(() => {
    const arr: SingleLeafProps[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        initialPos: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4 - 2,
        ],
        scale: 0.25 + Math.random() * 0.35,
        speed: 0.6 + Math.random() * 0.8,
        rotSpeed: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
      });
    }
    return arr;
  }, [count]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 4, 2]} intensity={1.2} color="#34d399" />
      {leavesData.map((leaf, idx) => (
        <FloatingLeaf key={idx} {...leaf} />
      ))}
    </>
  );
}
