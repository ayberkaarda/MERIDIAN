import { NormalBlending, ShaderMaterial } from 'three';
import grainVertex from '@/shaders/grain.vert';
import grainFragment from '@/shaders/grain.frag';

export interface GrainQuality {
  /** Grain opacity. */
  grain: number;
  vignette: number;
}

/** High tier only; mid/low skip the overlay and use the CSS `.scene-vignette`. */
export const grainQuality: GrainQuality = { grain: 0.055, vignette: 0.55 };

export function createGrainMaterial(quality: GrainQuality): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: grainVertex,
    fragmentShader: grainFragment,
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uGrain: { value: quality.grain },
      uVignette: { value: quality.vignette },
    },
    blending: NormalBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}
