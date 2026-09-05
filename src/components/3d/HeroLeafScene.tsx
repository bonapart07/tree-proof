'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  createBotanicalLeafGeometry,
  createStemGeometry,
  createSecondaryVeinGeometries,
  createBotanicalLeafTextures,
} from '@/lib/three-utils';

export type GrowthStage = 'seed' | 'sprout' | 'leaf' | 'tree' | 'forest';

interface HeroLeafSceneProps {
  stage?: GrowthStage;
  onStageChange?: (stage: GrowthStage) => void;
  scrollOffset?: number; // 0 to 1
  enableControls?: boolean;
}

// 3D Physical Dewdrop component with optical refraction
function WaterDroplet({
  position,
  scale = 0.05,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={[scale, scale * 0.55, scale]}>
      {/* Refractive Water Dome */}
      <mesh castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.96}
          opacity={1}
          transparent
          roughness={0.015}
          ior={1.333} // Optical index of water
          thickness={0.5}
          specularIntensity={1.0}
        />
      </mesh>
      {/* Contact shadow on leaf cuticle */}
      <mesh position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 16]} />
        <meshBasicMaterial color="#011409" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export default function HeroLeafScene({
  stage = 'leaf',
  scrollOffset = 0,
  enableControls = true,
}: HeroLeafSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leafMeshRef = useRef<THREE.Mesh>(null);
  const stemMeshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const { pointer } = useThree();

  // 1. High-resolution anatomical botanical leaf blade geometry
  const leafGeometry = useMemo(() => createBotanicalLeafGeometry(3.5, 1.7, 56, 80), []);
  const stemGeometry = useMemo(() => createStemGeometry(1.4, 0.075, 0.035), []);
  const secondaryVeins = useMemo(() => createSecondaryVeinGeometries(3.5, 1.7), []);

  // 2. High-resolution procedural textures (Color, Bump, Roughness)
  const textures = useMemo(() => createBotanicalLeafTextures(), []);

  // 3. Floating environmental pollen motes & glowing micro-spores
  const [particlePositions, particleColors] = useMemo(() => {
    const count = 160;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#34d399'), // mint
      new THREE.Color('#10b981'), // emerald
      new THREE.Color('#a7f3d0'), // soft sage
      new THREE.Color('#fde047'), // warm golden pollen
      new THREE.Color('#6ee7b7'), // luminous green
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    return [positions, colors];
  }, []);

  // Frame animation loop
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current && !enableControls) {
      // Damped mouse tracking if controls not overriding
      const targetRotX = pointer.y * 0.35 + Math.sin(time * 0.7) * 0.05 + scrollOffset * 0.5;
      const targetRotY = pointer.x * 0.45 + Math.cos(time * 0.5) * 0.08;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.04);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.04);
    }

    if (groupRef.current) {
      // Natural botanical breathing float
      groupRef.current.position.y = Math.sin(time * 1.1) * 0.1 - scrollOffset * 0.35;
      groupRef.current.position.x = Math.cos(time * 0.8) * 0.04;
    }

    // Leaf flutter / wind wave
    if (leafMeshRef.current) {
      leafMeshRef.current.rotation.z = Math.sin(time * 1.4) * 0.035;
      leafMeshRef.current.rotation.x = Math.cos(time * 1.0) * 0.025;
    }

    // Particle field motion: slow swirling drift
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.02;
      particlesRef.current.rotation.x = Math.sin(time * 0.02) * 0.06;
    }
  });

  return (
    <>
      {/* ================= CINEMATIC BOTANICAL LIGHTING ================= */}
      {/* Ambient Forest Base */}
      <ambientLight intensity={0.65} color="#052814" />

      {/* Key Sunlight (Highlights waxy cuticle and casts soft shadows) */}
      <directionalLight
        position={[6, 9, 6]}
        intensity={2.6}
        color="#fffbeb"
        castShadow
      />

      {/* Transillumination Backlight: Shines through leaf cellular tissue so veins glow */}
      <pointLight
        position={[-3, 1.8, -3.8]}
        intensity={4.0}
        color="#34d399"
        distance={12}
      />

      {/* Rim light highlighting ruffled blade edges */}
      <pointLight
        position={[4, -2, 3]}
        intensity={1.8}
        color="#a7f3d0"
        distance={9}
      />

      {/* Golden Sunlight Accent */}
      <pointLight
        position={[-2, -3, 3]}
        intensity={1.2}
        color="#fde047"
        distance={7}
      />

      {/* ================= MAIN 3D LEAF GROUP ================= */}
      <group ref={groupRef} position={[0, 0.1, 0]}>
        {/* ================= STAGE: SEED ================= */}
        {stage === 'seed' && (
          <group>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.7, 32, 32]} />
              <meshPhysicalMaterial
                color="#06381e"
                roughness={0.4}
                metalness={0.1}
                clearcoat={0.3}
              />
            </mesh>
            <mesh position={[0, 0, 0.06]} rotation={[0, 0, Math.PI / 4]}>
              <torusGeometry args={[0.65, 0.035, 16, 64, Math.PI * 1.5]} />
              <meshBasicMaterial color="#34d399" />
            </mesh>
            <pointLight intensity={2.5} distance={3} color="#4ade80" />
          </group>
        )}

        {/* ================= STAGE: SPROUT ================= */}
        {stage === 'sprout' && (
          <group position={[0, -0.2, 0]}>
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[0.07, 0.14, 1.4, 16]} />
              <meshPhysicalMaterial color="#22c55e" roughness={0.3} clearcoat={0.3} />
            </mesh>
            <mesh
              position={[0.35, 0.4, 0]}
              rotation={[0.3, 0.2, -0.6]}
              scale={[0.42, 0.42, 0.42]}
              geometry={leafGeometry}
            >
              <meshPhysicalMaterial
                map={textures.colorMap || undefined}
                bumpMap={textures.bumpMap || undefined}
                bumpScale={0.035}
                color="#4ade80"
                roughness={0.28}
                clearcoat={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh
              position={[-0.35, 0.4, 0]}
              rotation={[-0.3, -0.2, 0.6]}
              scale={[0.38, 0.38, 0.38]}
              geometry={leafGeometry}
            >
              <meshPhysicalMaterial
                map={textures.colorMap || undefined}
                bumpMap={textures.bumpMap || undefined}
                bumpScale={0.035}
                color="#22c55e"
                roughness={0.28}
                clearcoat={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )}

        {/* ================= STAGE: LEAF (Hyper-Realistic Botanical Masterpiece) ================= */}
        {stage === 'leaf' && (
          <group>
            {/* Natural 3D Curved Stem (Petiole) */}
            <mesh
              ref={stemMeshRef}
              geometry={stemGeometry}
              position={[0, -2.0, -0.25]}
              rotation={[0.18, 0, 0]}
              castShadow
            >
              <meshPhysicalMaterial
                color="#064e29"
                roughness={0.32}
                metalness={0.04}
                clearcoat={0.4}
              />
            </mesh>

            {/* Anatomical 3D Sculpted Leaf Lamina with Translucent Subsurface Glow */}
            <mesh
              ref={leafMeshRef}
              geometry={leafGeometry}
              position={[0, 0, 0]}
              castShadow
              receiveShadow
            >
              <meshPhysicalMaterial
                map={textures.colorMap || undefined}
                bumpMap={textures.bumpMap || undefined}
                bumpScale={0.055} // Deep embossed vein texture
                roughnessMap={textures.roughnessMap || undefined}
                roughness={0.26}
                metalness={0.05}
                transmission={0.25} // Realistic biological translucency
                ior={1.45} // Botanical cutin refractive index
                clearcoat={0.65} // Dewy waxy cuticle sheen
                clearcoatRoughness={0.18}
                sheen={1.0} // Cellular velvet rim sheen
                sheenColor={new THREE.Color('#a7f3d0')}
                sheenRoughness={0.25}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Physical 3D Central Midrib (Stout spine tapering towards tip) */}
            <mesh position={[0, -0.12, 0.025]} rotation={[0.02, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.07, 3.25, 16]} />
              <meshPhysicalMaterial
                color="#98f6a9"
                roughness={0.18}
                emissive="#10b981"
                emissiveIntensity={0.3}
                clearcoat={0.7}
              />
            </mesh>

            {/* Physical 3D Secondary Branching Vein Tubes */}
            {secondaryVeins.map((geom, idx) => (
              <mesh key={idx} geometry={geom}>
                <meshPhysicalMaterial
                  color="#6ee7b7"
                  emissive="#059669"
                  emissiveIntensity={0.2}
                  roughness={0.22}
                  clearcoat={0.5}
                />
              </mesh>
            ))}

            {/* Physical 3D Refractive Water Dewdrops */}
            <WaterDroplet position={[0.09, 0.45, 0.08]} scale={0.06} />
            <WaterDroplet position={[-0.2, 0.85, 0.07]} scale={0.048} />
            <WaterDroplet position={[0.26, -0.35, 0.06]} scale={0.054} />
            <WaterDroplet position={[-0.05, -0.95, 0.07]} scale={0.065} />
            <WaterDroplet position={[0.14, 1.25, 0.04]} scale={0.042} />
            <WaterDroplet position={[-0.28, -0.2, 0.05]} scale={0.046} />
          </group>
        )}

        {/* ================= STAGE: TREE / FOREST ================= */}
        {(stage === 'tree' || stage === 'forest') && (
          <group position={[0, -1.3, 0]}>
            <mesh position={[0, 1.1, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.38, 2.2, 16]} />
              <meshStandardMaterial color="#3b2b1e" roughness={0.85} />
            </mesh>
            <mesh position={[0.45, 1.8, 0.2]} rotation={[0.4, 0.2, -0.7]} castShadow>
              <cylinderGeometry args={[0.09, 0.14, 1.0, 12]} />
              <meshStandardMaterial color="#3b2b1e" roughness={0.85} />
            </mesh>
            <mesh position={[-0.45, 2.0, -0.2]} rotation={[-0.4, -0.3, 0.6]} castShadow>
              <cylinderGeometry args={[0.09, 0.14, 0.9, 12]} />
              <meshStandardMaterial color="#3b2b1e" roughness={0.85} />
            </mesh>

            {/* Canopy Foliage Clusters */}
            <mesh position={[0, 2.6, 0]} castShadow>
              <dodecahedronGeometry args={[1.2, 1]} />
              <meshPhysicalMaterial
                color="#10b981"
                roughness={0.35}
                clearcoat={0.3}
                flatShading
              />
            </mesh>
            <mesh position={[0.8, 2.2, 0.4]} castShadow>
              <dodecahedronGeometry args={[0.9, 1]} />
              <meshPhysicalMaterial
                color="#059669"
                roughness={0.35}
                clearcoat={0.3}
                flatShading
              />
            </mesh>
            <mesh position={[-0.7, 2.3, -0.3]} castShadow>
              <dodecahedronGeometry args={[0.95, 1]} />
              <meshPhysicalMaterial
                color="#34d399"
                roughness={0.35}
                clearcoat={0.3}
                flatShading
              />
            </mesh>
            <mesh position={[0, 3.2, 0]} castShadow>
              <dodecahedronGeometry args={[0.8, 1]} />
              <meshPhysicalMaterial
                color="#6ee7b7"
                roughness={0.35}
                clearcoat={0.3}
                flatShading
              />
            </mesh>
          </group>
        )}
      </group>

      {/* OrbitControls: Allows users to click-and-drag to rotate the leaf in 360° */}
      {enableControls && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.8}
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 3.0}
        />
      )}

      {/* ================= FLOATING 3D BOTANICAL PARTICLES ================= */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.085}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
