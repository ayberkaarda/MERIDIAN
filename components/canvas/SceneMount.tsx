'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { useMeridianStore } from '@/store';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { OrbitalLabelOverlay } from '@/components/ui/OrbitalLabelOverlay';
import { ReturnPhaseBridge } from '@/components/ui/ReturnPhaseBridge';

// Three.js / R3F load as their own chunk, after hydration, never in the route's first script set.
const SceneRoot = dynamic(() => import('./SceneRoot').then((module) => ({ default: module.SceneRoot })), {
  ssr: false,
});

const subscribe = (): (() => void) => () => undefined;

export function SceneMount() {
  const tier = useMeridianStore((state) => state.tier);
  // Tier is only known on the client; render the vignette after mount to keep hydration identical.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <>
      <CanvasErrorBoundary><SceneRoot /></CanvasErrorBoundary>
      {mounted && tier !== 'high' ? <div className="scene-vignette" aria-hidden="true" /> : null}
      <OrbitalLabelOverlay />
      <ReturnPhaseBridge />
    </>
  );
}
