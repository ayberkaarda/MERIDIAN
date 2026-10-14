import { Color, LineBasicMaterial, ShaderMaterial } from 'three';
import type { DeviceTier } from '@/lib/tiers';
import orbitalVertex from '@/shaders/orbital.vert';
import orbitalFragment from '@/shaders/orbital.frag';
import { PLANET_LIGHT_DIRECTION } from './planetMaterial';

export interface OrbitalQuality {
  /** Bodies per ring, inner to outer. */
  bodies: readonly [number, number, number];
  /** Line segments per ring loop. */
  ringSegments: number;
  /** Icosahedron subdivision of the core. */
  coreDetail: number;
}

// High carries the full belt, mid halves it (spec section 8), low keeps a
// token body set so each ring still reads as an orbit rather than a line.
export const orbitalQuality: Record<DeviceTier, OrbitalQuality> = {
  high: { bodies: [18, 28, 40], ringSegments: 256, coreDetail: 1 },
  mid: { bodies: [9, 14, 20], ringSegments: 192, coreDetail: 1 },
  low: { bodies: [3, 4, 5], ringSegments: 128, coreDetail: 0 },
};

const LIGHT_COLOR = new Color(1, 0.975, 0.95);
const RIM_COLOR = new Color(0.64, 0.68, 0.73);
/** Desaturated graphite for the core; bodies sit a step lighter so they read at small sizes. */
const CORE_ALBEDO = new Color(0.3, 0.3, 0.29);
const BODY_ALBEDO = new Color(0.58, 0.57, 0.55);
/** --ink-light; three converts the sRGB hex to linear. */
const RING_COLOR = new Color('#f4f1ea');

export function createFacetMaterial(kind: 'core' | 'body'): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: orbitalVertex,
    fragmentShader: orbitalFragment,
    uniforms: {
      uLightDirection: { value: PLANET_LIGHT_DIRECTION.clone() },
      uLightColor: { value: LIGHT_COLOR.clone() },
      uAlbedo: { value: (kind === 'core' ? CORE_ALBEDO : BODY_ALBEDO).clone() },
      uRimColor: { value: RIM_COLOR.clone() },
      uFade: { value: 0 },
    },
  });
}

/** Hairline material for rings and the core lattice; opacity is driven per frame. */
export function createLineMaterial(): LineBasicMaterial {
  return new LineBasicMaterial({
    color: RING_COLOR.clone(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
}
