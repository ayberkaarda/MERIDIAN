'use client';

import { lazy, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { getTierDpr } from '@/lib/tiers';
import { useMeridianStore } from '@/store';
import { CameraRig } from './CameraRig';
import { LoadingBridge } from './LoadingBridge';

const Planet = lazy(() => import('./bodies/Planet').then((module) => ({ default: module.Planet })));
const Effects = lazy(() => import('./effects/Effects').then((module) => ({ default: module.Effects })));
const OrbitalSystem = lazy(() => import('./bodies/OrbitalSystem').then((module) => ({ default: module.OrbitalSystem })));
const TechnologyVisual = lazy(() => import('./bodies/TechnologyVisual').then((module) => ({ default: module.TechnologyVisual })));

export function SceneRoot() {
  const tier = useMeridianStore((state) => state.tier);
  return (
    <><LoadingBridge /><Canvas
      aria-hidden="true"
      tabIndex={-1}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      dpr={getTierDpr(tier)}
      camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 1000 }}
      gl={{ alpha: true, antialias: false }}
    >
      <CameraRig />
      <Suspense fallback={null}><Planet /></Suspense>
      <Suspense fallback={null}><OrbitalSystem /></Suspense>
      <Suspense fallback={null}><TechnologyVisual /></Suspense>
      <Suspense fallback={null}><Effects /></Suspense>
    </Canvas></>
  );
}
