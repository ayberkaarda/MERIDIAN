'use client';

import { useEffect } from 'react';
import { detectDeviceTier, type DeviceTier } from '../lib/tiers';
import { useMeridianStore } from '../store';

let detection: Promise<DeviceTier> | undefined;
export function useDeviceTier(): DeviceTier {
  const tier = useMeridianStore((state) => state.tier);
  useEffect(() => {
    let mounted = true;
    detection ??= detectDeviceTier().catch((): DeviceTier => 'low');
    void detection.then((detectedTier) => {
      if (mounted) useMeridianStore.getState().setTier(detectedTier);
    });
    return () => { mounted = false; };
  }, []);
  return tier;
}
