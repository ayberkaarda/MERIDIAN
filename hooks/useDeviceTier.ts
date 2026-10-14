'use client';

import { useEffect } from 'react';
import { detectDeviceTier, type DeviceTier } from '../lib/tiers';
import { useMeridianStore } from '../store';

let detectedTier: DeviceTier | undefined;
export function useDeviceTier(): DeviceTier {
  const tier = useMeridianStore((state) => state.tier);
  useEffect(() => {
    detectedTier ??= detectDeviceTier();
    useMeridianStore.getState().setTier(detectedTier);
  }, []);
  return tier;
}
