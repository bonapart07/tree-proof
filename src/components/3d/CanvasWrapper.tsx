'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';

interface CanvasWrapperProps {
  children: React.ReactNode;
  className?: string;
  camera?: {
    position?: [number, number, number];
    fov?: number;
  };
  gl?: Record<string, unknown>;
}

export default function CanvasWrapper({
  children,
  className = 'w-full h-full',
  camera = { position: [0, 0, 5], fov: 45 },
  gl = { antialias: true, alpha: true, powerPreference: 'high-performance' },
}: CanvasWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center bg-[#060a08]/40 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <span className="text-xs font-mono text-emerald-400/60 tracking-wider">INITIALIZING 3D ECOSYSTEM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={camera}
        gl={gl}
        dpr={[1, 2]} // clamp DPR to 2 for 60fps performance
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
