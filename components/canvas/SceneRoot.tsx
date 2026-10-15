'use client';

import { Component, lazy, Suspense, useEffect, useInsertionEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot, extend } from '@react-three/fiber';
import { BoxGeometry, CylinderGeometry, DirectionalLight, Group, InstancedMesh, LineLoop, LineSegments, Mesh, Object3D, SphereGeometry, TorusGeometry } from 'three';
import { getTierDpr } from '@/lib/tiers';
import { observeSceneViewport } from '@/hooks/sceneViewport';
import { useMeridianStore } from '@/store';
import { CameraRig } from './CameraRig';
import { LoadingBridge } from './LoadingBridge';
import { TickerDriver } from './TickerDriver';

const Planet = lazy(() => import('./bodies/Planet').then((module) => ({ default: module.Planet })));
const Effects = lazy(() => import('./effects/Effects').then((module) => ({ default: module.Effects })));
const OrbitalSystem = lazy(() => import('./bodies/OrbitalSystem').then((module) => ({ default: module.OrbitalSystem })));
const TechnologyVisual = lazy(() => import('./bodies/TechnologyVisual').then((module) => ({ default: module.TechnologyVisual })));
const SunBody = lazy(() => import('./bodies/SunBody').then((module) => ({ default: module.SunBody })));
const Spacecraft = lazy(() => import('./bodies/Spacecraft').then((module) => ({ default: module.Spacecraft })));
const StoryVisual = lazy(() => import('./bodies/StoryVisual').then((module) => ({ default: module.StoryVisual })));

extend({ BoxGeometry, CylinderGeometry, DirectionalLight, Group, InstancedMesh, LineLoop, LineSegments, Mesh, Object3D, SphereGeometry, TorusGeometry });

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: (error: Error) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

function SceneContents() {
  return <>
    <TickerDriver />
    <CameraRig />
    <Suspense fallback={null}><Planet /></Suspense>
    <Suspense fallback={null}><OrbitalSystem /></Suspense>
    <Suspense fallback={null}><TechnologyVisual /></Suspense>
    <Suspense fallback={null}><SunBody /></Suspense>
    <Suspense fallback={null}><Spacecraft /></Suspense>
    <Suspense fallback={null}><StoryVisual /></Suspense>
    <Suspense fallback={null}><Effects /></Suspense>
  </>;
}

export function SceneRoot() {
  const tier = useMeridianStore((state) => state.tier);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const tierDpr = getTierDpr(tier);
  const minimumDpr = typeof tierDpr === 'number' ? 1 : tierDpr[0];
  const maximumDpr = typeof tierDpr === 'number' ? tierDpr : tierDpr[1];

  useInsertionEffect(() => () => {
    const root = rootRef.current;
    rootRef.current = null;
    root?.unmount();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const root = rootRef.current ??= createRoot(canvas);
    let disposed = false;
    const fail = (cause: unknown) => {
      if (!disposed) setError(cause instanceof Error ? cause : new Error(String(cause)));
    };
    const disconnect = observeSceneViewport(canvas, (size) => {
      void root.configure({
      frameloop: 'never',
      dpr: [minimumDpr, maximumDpr],
      camera: { position: [0, 0, 8], fov: 45, near: 0.1, far: 1000 },
      gl: { alpha: true, antialias: false },
      size,
    }).then(() => {
      if (!disposed) root.render(<SceneErrorBoundary onError={setError}><SceneContents /></SceneErrorBoundary>);
      }).catch(fail);
    });
    return () => {
      disposed = true;
      disconnect();
    };
  }, [minimumDpr, maximumDpr]);

  if (error) throw error;
  return <>
    <LoadingBridge />
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      <canvas ref={canvasRef} tabIndex={-1} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  </>;
}