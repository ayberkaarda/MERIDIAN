import { ShaderMaterial } from 'three';
import type { Story } from '@/data/stories';
import type { DeviceTier } from '@/lib/tiers';
import noise from '@/shaders/noise.glsl';
import storyCommon from '@/shaders/storyCommon.glsl';
import habitatFragment from '@/shaders/storyHabitat.frag';
import journeyFragment from '@/shaders/storyJourney.frag';
import orbitFragment from '@/shaders/storyOrbit.frag';
// The story quads are the same clip-space panel quad as the technology fields.
import panelVertex from '@/shaders/tech.vert';

export type StoryVisualKind = Story['visual'];

export interface StoryQuality {
  octaves: number;
  /** Low tier renders a still frame: no time uniform changes after creation. */
  animated: boolean;
  grain: number;
}

export const storyQuality: Record<DeviceTier, StoryQuality> = {
  high: { octaves: 4, animated: true, grain: 0.012 },
  mid: { octaves: 3, animated: true, grain: 0.012 },
  low: { octaves: 2, animated: false, grain: 0.012 },
};

/**
 * Time at which static (low tier, reduced motion) panels are frozen: the
 * satellite, light and craft marker each sit in a composed position.
 */
export const STORY_STILL_TIME = 11.0;

const fragments: Record<StoryVisualKind, string> = {
  orbit: orbitFragment,
  habitat: habitatFragment,
  journey: journeyFragment,
};

export function createStoryMaterial(visual: StoryVisualKind, quality: StoryQuality): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: panelVertex,
    fragmentShader: `${noise}\n${storyCommon}\n${fragments[visual]}`,
    defines: { STORY_OCTAVES: quality.octaves },
    uniforms: {
      uTime: { value: STORY_STILL_TIME },
      uAspect: { value: 1 },
      uGrain: { value: quality.grain },
    },
    // Opaque quad on the near plane: it writes depth so the main scene, drawn
    // after it, stays hidden inside the panel (see panels/PanelPass).
    transparent: false,
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  });
}
