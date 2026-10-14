import {
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector3,
  type Matrix4,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import type { DeviceTier } from '@/lib/tiers';

export interface CraftQuality {
  /** Radial segments of round hull sections. */
  radialSegments: number;
  /** Torus segments of the docking ring: around the ring and around the tube. */
  ringSegments: readonly [number, number];
  /** Antenna, struts and the secondary tank only exist above the low tier. */
  details: boolean;
  /** MeshPhysicalMaterial with anisotropy, or a plain standard material. */
  physical: boolean;
}

// Facets are part of the look (flat shading), so even high stays low-poly; the
// low tier drops to hexagonal hulls, a coarse ring and the cheaper BRDF.
export const craftQuality: Record<DeviceTier, CraftQuality> = {
  high: { radialSegments: 12, ringSegments: [32, 8], details: true, physical: true },
  mid: { radialSegments: 10, ringSegments: [24, 6], details: true, physical: true },
  low: { radialSegments: 6, ringSegments: [16, 4], details: false, physical: false },
};

export type CraftFinish = 'hull' | 'radiator' | 'dark';

interface FinishDefinition {
  color: string;
  roughness: number;
  metalness: number;
  /** Strength of the brushed highlight along the UV tangent. */
  anisotropy: number;
  anisotropyRotation: number;
}

/** Neutral, desaturated finishes: a graphite hull, pale bone radiators, dark nozzle and collar. */
const FINISHES: Record<CraftFinish, FinishDefinition> = {
  hull: { color: '#7f7e7a', roughness: 0.64, metalness: 0.22, anisotropy: 0.22, anisotropyRotation: 0 },
  radiator: { color: '#c8c5be', roughness: 0.56, metalness: 0.08, anisotropy: 0.32, anisotropyRotation: Math.PI / 2 },
  dark: { color: '#2b2b2a', roughness: 0.72, metalness: 0.3, anisotropy: 0.12, anisotropyRotation: 0 },
};

/** Key: neutral white from above the docking end, on the camera side of the sweep. */
export const CRAFT_KEY = { color: new Color('#f3efe8'), intensity: 2.8, position: [-6, 7, 5] as const };
/** Fill: cool and low, from the opposite flank (--cool, desaturated). */
export const CRAFT_FILL = { color: new Color('#a9bbd8'), intensity: 0.45, position: [6, -3, 3] as const };
/** Rim: strong and from behind the radiator plane, so the mid sweep reads as a backlit silhouette. */
export const CRAFT_RIM = { color: new Color('#ffffff'), intensity: 3.6, position: [1.5, 3, -8] as const };

/*
 * Values shared by every craft program. The rim light alone barely reaches a
 * silhouette under flat shading, so a facet-wise Fresnel term on the rim side
 * carries the edge. The wash blends the final (display-space) colour into the
 * light page colour, so the craft dissolves into the filling sun disc while
 * staying opaque: no sorting artefacts and no program switch.
 */
const craftUniforms = {
  uRimDirection: { value: new Vector3(0, 0, -1) },
  uRimColor: { value: new Color('#e6ebf2') },
  uRimStrength: { value: 0.5 },
  uWash: { value: 0 },
  /** --bg-light in display space: compared against the final output colour. */
  uWashColor: { value: new Vector3(0xf4 / 255, 0xf1 / 255, 0xea / 255) },
};

const RIM_STRENGTH = 0.5;
const rimWorldDirection = new Vector3();

/**
 * Per-frame update for all craft materials: rim direction in view space (from a
 * craft-local light position and the craft yaw), rim gain and wash amount.
 */
export function updateCraftShading(viewMatrix: Matrix4, craftYaw: number, rimGain: number, wash: number): void {
  const [x, y, z] = CRAFT_RIM.position;
  const cos = Math.cos(craftYaw);
  const sin = Math.sin(craftYaw);
  rimWorldDirection.set(x * cos + z * sin, y, -x * sin + z * cos).normalize();
  craftUniforms.uRimDirection.value.copy(rimWorldDirection).transformDirection(viewMatrix);
  craftUniforms.uRimStrength.value = RIM_STRENGTH * rimGain;
  craftUniforms.uWash.value = wash;
}

const RIM_CHUNK = /* glsl */ `
  float craftFacing = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
  float craftRimSide = smoothstep(-0.15, 0.6, dot(normal, uRimDirection));
  outgoingLight += uRimColor * (uRimStrength * craftFacing * craftFacing * craftFacing * craftRimSide);
  #include <opaque_fragment>`;

const WASH_CHUNK = /* glsl */ `#include <colorspace_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uWashColor, uWash);`;

function extendCraftShader(shader: WebGLProgramParametersWithUniforms): void {
  Object.assign(shader.uniforms, craftUniforms);
  shader.fragmentShader = shader.fragmentShader
    .replace(
      'void main() {',
      'uniform vec3 uRimDirection;\nuniform vec3 uRimColor;\nuniform float uRimStrength;\nuniform float uWash;\nuniform vec3 uWashColor;\nvoid main() {',
    )
    .replace('#include <opaque_fragment>', RIM_CHUNK)
    .replace('#include <colorspace_fragment>', WASH_CHUNK);
}

/** Matte craft material: flat-shaded facets, subtle anisotropy above the low tier. */
export function createCraftMaterial(finish: CraftFinish, quality: CraftQuality): MeshStandardMaterial {
  const definition = FINISHES[finish];
  const shared = {
    color: new Color(definition.color),
    roughness: definition.roughness,
    metalness: definition.metalness,
    flatShading: true,
    // The open engine bell is seen from inside on the aft half of the sweep.
    ...(finish === 'dark' ? { side: DoubleSide } : {}),
  };
  const material = quality.physical
    ? new MeshPhysicalMaterial({
        ...shared,
        anisotropy: definition.anisotropy,
        anisotropyRotation: definition.anisotropyRotation,
      })
    : new MeshStandardMaterial(shared);
  material.onBeforeCompile = extendCraftShader;
  material.customProgramCacheKey = () => 'meridian-craft';
  return material;
}
