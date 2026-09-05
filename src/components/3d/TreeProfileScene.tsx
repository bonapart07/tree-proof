'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TreeData } from '@/types';

interface TreeProfileSceneProps {
  tree: TreeData;
  growthDay?: number; // 0, 30, 90, 180, 365
}

export default function TreeProfileScene({
  tree,
  growthDay = 120,
}: TreeProfileSceneProps) {
  const treeGroupRef = useRef<THREE.Group>(null);
  const canopyRef = useRef<THREE.Group>(null);

  // Compute growth factor based on timeline day (0 to 365)
  const growthNormalized = Math.min(1.0, Math.max(0.1, growthDay / 365));
  const scale = 0.4 + growthNormalized * 0.9; // 0.49 to 1.3
  const canopyScale = 0.3 + Math.pow(growthNormalized, 0.7) * 1.1;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (treeGroupRef.current) {
      // Natural botanical wind sway
      treeGroupRef.current.rotation.z = Math.sin(t * 1.2) * 0.025;
      treeGroupRef.current.rotation.x = Math.cos(t * 0.9) * 0.015;
    }
    if (canopyRef.current) {
      canopyRef.current.rotation.y = Math.sin(t * 0.5) * 0.04;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2.0}
        color="#f0fdf4"
        castShadow
      />
      <pointLight position={[-4, 3, -2]} intensity={1.2} color="#34d399" />
      <pointLight position={[3, 1, 3]} intensity={0.8} color="#fef08a" />

      {/* Reforestation substrate base with GPS rings */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.8, 48]} />
        <meshStandardMaterial color="#082015" roughness={0.9} />
      </mesh>
      {/* Telemetry targeting reticle ring */}
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 2.45, 48]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
      </mesh>

      {/* Main Tree Model with Dynamic Growth Scaling */}
      <group ref={treeGroupRef} position={[0, 0, 0]} scale={[scale, scale, scale]}>
        {/* Trunk */}
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <cylinderGeometry
            args={[
              0.14 * (0.5 + growthNormalized * 0.6),
              0.28 * (0.5 + growthNormalized * 0.6),
              2.2,
              16,
            ]}
          />
          <meshStandardMaterial color="#382517" roughness={0.85} />
        </mesh>

        {/* Primary side branches */}
        <mesh position={[0.45, 1.8, 0.1]} rotation={[0.4, 0, -0.7]} castShadow>
          <cylinderGeometry args={[0.06 * scale, 0.1 * scale, 1.0, 10]} />
          <meshStandardMaterial color="#382517" roughness={0.85} />
        </mesh>
        <mesh position={[-0.45, 2.0, -0.1]} rotation={[-0.3, 0, 0.7]} castShadow>
          <cylinderGeometry args={[0.06 * scale, 0.1 * scale, 0.9, 10]} />
          <meshStandardMaterial color="#382517" roughness={0.85} />
        </mesh>

        {/* Canopy foliage clusters */}
        <group ref={canopyRef} position={[0, 2.7, 0]} scale={[canopyScale, canopyScale, canopyScale]}>
          <mesh position={[0, 0, 0]} castShadow>
            <dodecahedronGeometry args={[1.2, 1]} />
            <meshStandardMaterial
              color={tree.status === 'healthy' ? '#10b981' : tree.status === 'moderate' ? '#eab308' : '#f97316'}
              roughness={0.35}
              metalness={0.1}
            />
          </mesh>
          <mesh position={[0.6, -0.2, 0.4]} castShadow>
            <dodecahedronGeometry args={[0.85, 1]} />
            <meshStandardMaterial
              color="#059669"
              roughness={0.35}
            />
          </mesh>
          <mesh position={[-0.6, -0.1, -0.3]} castShadow>
            <dodecahedronGeometry args={[0.9, 1]} />
            <meshStandardMaterial
              color="#34d399"
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <dodecahedronGeometry args={[0.75, 1]} />
            <meshStandardMaterial
              color="#6ee7b7"
              roughness={0.35}
            />
          </mesh>
        </group>
      </group>

      <OrbitControls
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}
