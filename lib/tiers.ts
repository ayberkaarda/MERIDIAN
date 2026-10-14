export type DeviceTier = 'high' | 'mid' | 'low';
export interface DeviceSignals {
  dpr: number;
  cores: number;
  memory: number | null;
  coarsePointer: boolean;
  benchmarkFps?: number;
}
export const tierSettings = {
  high: { maxDpr: 2, postprocessing: true, particleMultiplier: 1, animatedPanels: true, cameraKeyframes: 'full', autonomousOrbit: false },
  mid: { maxDpr: 1.5, postprocessing: false, particleMultiplier: 0.5, animatedPanels: true, cameraKeyframes: 'full', autonomousOrbit: false },
  low: { maxDpr: 1, postprocessing: false, particleMultiplier: 0.5, animatedPanels: false, cameraKeyframes: 'two', autonomousOrbit: true },
} as const;

export function getTierOverride(search: string): DeviceTier | null {
  const tier = new URLSearchParams(search).get('tier');
  return tier === 'high' || tier === 'mid' || tier === 'low' ? tier : null;
}

export function classifyDeviceTier(signals: DeviceSignals): DeviceTier {
  if (signals.coarsePointer || signals.cores <= 2 || (signals.memory !== null && signals.memory <= 2) || (signals.benchmarkFps !== undefined && signals.benchmarkFps < 45)) return 'low';
  if (signals.dpr > 2 || signals.cores < 8 || (signals.memory !== null && signals.memory < 8) || (signals.benchmarkFps !== undefined && signals.benchmarkFps < 60)) return 'mid';
  return 'high';
}

// Phase 0 uses hardware signals; the 200ms WebGL benchmark belongs to Phase 1.
export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'low';
  const override = getTierOverride(window.location.search);
  if (override) return override;
  const device = navigator as Navigator & { deviceMemory?: number };
  return classifyDeviceTier({ dpr: window.devicePixelRatio || 1, cores: device.hardwareConcurrency || 2, memory: device.deviceMemory ?? null, coarsePointer: window.matchMedia('(pointer: coarse)').matches });
}
