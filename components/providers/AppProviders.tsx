'use client';

import { useEffect, type ReactNode } from 'react';
import { useProgress } from '@react-three/drei';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePointer } from '@/hooks/usePointer';
import { useMeridianStore } from '@/store';
import { ScrollProvider } from './ScrollProvider';

function LoadingBridge() {
  useEffect(() => {
    let fontsReady = false;
    let disposed = false;
    const update = (): void => {
      if (disposed) return;
      const { active, progress, total, loaded } = useProgress.getState();
      const assets = total === 0 ? 100 : Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0));
      const complete = fontsReady && !active && (total === 0 || loaded >= total);
      useMeridianStore.getState().setLoadingProgress(complete ? 100 : Math.min(99, assets * 0.9 + (fontsReady ? 10 : 0)));
    };
    const unsubscribe = useProgress.subscribe(update);
    void document.fonts.ready.then(() => { fontsReady = true; update(); });
    update();
    return () => { disposed = true; unsubscribe(); };
  }, []);
  return null;
}

function EnvironmentBridge() {
  useDeviceTier();
  useReducedMotion();
  usePointer();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return <><EnvironmentBridge /><LoadingBridge /><ScrollProvider>{children}</ScrollProvider></>;
}
