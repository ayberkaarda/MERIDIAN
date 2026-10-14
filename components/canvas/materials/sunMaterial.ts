import { Color, ShaderMaterial, Vector2 } from 'three';
import type { DeviceTier } from '@/lib/tiers';
import noise from '@/shaders/noise.glsl';
import sunVertex from '@/shaders/sun.vert';
import sunFragment from '@/shaders/sun.frag';

export interface SunQuality {
  octaves: number;
  /** Low tier keeps the surface still (static uniforms). */
  animated: boolean;
}

export const sunQuality: Record<DeviceTier, SunQuality> = {
  high: { octaves: 4, animated: true },
  mid: { octaves: 3, animated: true },
  low: { octaves: 2, animated: false },
};

/** --bg-light; three converts the sRGB hex to linear and the shader converts back. */
const PAGE_LIGHT = new Color('#f4f1ea');
/** A step below the page colour, so the disc reads against space before it fills. */
const SURFACE = new Color('#e8e3d8');
/** Limb darkening heads to a cool grey, never to orange. */
const LIMB = new Color('#b9b5ad');

export function createSunMaterial(quality: SunQuality): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: `${noise}\n${sunFragment}`,
    defines: { SURFACE_OCTAVES: quality.octaves },
    uniforms: {
      uAspect: { value: 1 },
      uCenter: { value: new Vector2(0, -4) },
      uRadius: { value: 1 },
      uDetail: { value: 1 },
      uOpacity: { value: 1 },
      // Low tier: a fixed, representative surface.
      uTime: { value: 37 },
      uSurface: { value: SURFACE.clone() },
      uLimb: { value: LIMB.clone() },
      uFlat: { value: PAGE_LIGHT.clone() },
    },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
}
