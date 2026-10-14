'use client';

import { useEffect, type ReactNode } from 'react';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePointer } from '@/hooks/usePointer';
import { PanelRectBridge } from '@/hooks/PanelRectBridge';
import { useMeridianStore } from '@/store';
import { LOADING_TIMEOUT_MS } from '@/lib/motion';
import { ScrollProvider } from './ScrollProvider';

function LoadingBridge() {
  useEffect(() => {
    let disposed = false;
    const finish = (): void => {
      if (!disposed) useMeridianStore.getState().setLoadingProgress(100);
    };
    // Independent of font promises, canvas Suspense, and motion preferences.
    const timeout = window.setTimeout(finish, LOADING_TIMEOUT_MS);
    if (document.fonts) void document.fonts.ready.then(finish, finish);
    else finish();
    return () => { disposed = true; window.clearTimeout(timeout); };
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
  return <><EnvironmentBridge /><PanelRectBridge /><LoadingBridge /><ScrollProvider>{children}</ScrollProvider></>;
}
