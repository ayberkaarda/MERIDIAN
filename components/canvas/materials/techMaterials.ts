import { ShaderMaterial } from 'three';
import type { TechnologyVisual } from '@/data/technologies';
import type { DeviceTier } from '@/lib/tiers';
import noise from '@/shaders/noise.glsl';
import techCommon from '@/shaders/techCommon.glsl';
import techVertex from '@/shaders/tech.vert';
import plasmaFragment from '@/shaders/techPlasma.frag';
import thermalFragment from '@/shaders/techThermal.frag';
import trajectoryFragment from '@/shaders/techTrajectory.frag';
import volumeFragment from '@/shaders/techVolume.frag';

export interface TechQuality {
  octaves: number;
  volumeSteps: number;
  /** Low tier renders a still frame: no uniform changes after creation. */
  animated: boolean;
  grain: number;
}

export const techQuality: Record<DeviceTier, TechQuality> = {
  high: { octaves: 5, volumeSteps: 12, animated: true, grain: 0.003 },
  mid: { octaves: 4, volumeSteps: 8, animated: true, grain: 0.003 },
  low: { octaves: 3, volumeSteps: 6, animated: false, grain: 0.003 },
};

/**
 * Time at which static (low tier, reduced motion) panels are frozen. Chosen so
 * every field sits in a composed, asymmetric state rather than at t = 0.
 */
export const TECH_STILL_TIME = 14.5;

const fragments: Record<TechnologyVisual, string> = {
  plasma: plasmaFragment,
  thermal: thermalFragment,
  trajectory: trajectoryFragment,
  volume: volumeFragment,
};

export function createTechMaterial(visual: TechnologyVisual, quality: TechQuality): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: techVertex,
    fragmentShader: `${noise}\n${techCommon}\n${fragments[visual]}`,
    defines: {
      TECH_OCTAVES: quality.octaves,
      VOLUME_STEPS: quality.volumeSteps,
    },
    uniforms: {
      uTime: { value: TECH_STILL_TIME },
      uAspect: { value: 1 },
      uReveal: { value: 1 },
      uGrain: { value: quality.grain },
    },
    transparent: true,
    // The quad sits on the near plane and writes depth so the main scene,
    // drawn after it, stays hidden inside the panel (see TechnologyVisual).
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  });
}
