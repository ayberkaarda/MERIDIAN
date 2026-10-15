import { AdditiveBlending, BackSide, Color, ShaderMaterial, Vector3 } from 'three';
import type { DeviceTier } from '@/lib/tiers';
import noise from '@/shaders/noise.glsl';
import planetVertex from '@/shaders/planet.vert';
import planetFragment from '@/shaders/planet.frag';
import atmosphereVertex from '@/shaders/atmosphere.vert';
import atmosphereFragment from '@/shaders/atmosphere.frag';

export interface PlanetQuality {
  widthSegments: number;
  heightSegments: number;
  terrainOctaves: number;
  cloudOctaves: number;
  domainWarp: boolean;
  atmosphere: boolean;
}

// Shading is per-fragment, so geometry only has to keep the silhouette round;
// the shader budget (octaves, warp, clouds) is what scales with the tier.
export const planetQuality: Record<DeviceTier, PlanetQuality> = {
  high: { widthSegments: 128, heightSegments: 96, terrainOctaves: 6, cloudOctaves: 4, domainWarp: true, atmosphere: true },
  mid: { widthSegments: 96, heightSegments: 64, terrainOctaves: 5, cloudOctaves: 3, domainWarp: false, atmosphere: true },
  low: { widthSegments: 64, heightSegments: 40, terrainOctaves: 4, cloudOctaves: 0, domainWarp: false, atmosphere: false },
};

/** Key light comes from the right and slightly in front: the limb facing the headline stays dark. */
export const PLANET_LIGHT_DIRECTION = new Vector3(1, 0.32, 0.38).normalize();
const LIGHT_COLOR = new Color(1, 0.975, 0.95);
const RIM_COLOR = new Color(0.64, 0.68, 0.73);
export const ATMOSPHERE_SCALE = 1.035;
export const ATMOSPHERE_INTENSITY = 0.32;

export function createPlanetMaterial(quality: PlanetQuality): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: planetVertex,
    fragmentShader: `${noise}\n${planetFragment}`,
    defines: {
      TERRAIN_OCTAVES: quality.terrainOctaves,
      CLOUD_OCTAVES: quality.cloudOctaves,
      DOMAIN_WARP: quality.domainWarp ? 1 : 0,
    },
    uniforms: {
      uLightDirection: { value: PLANET_LIGHT_DIRECTION.clone() },
      uLightColor: { value: LIGHT_COLOR.clone() },
      uRimColor: { value: RIM_COLOR.clone() },
      uTime: { value: 0 },
      uSaturation: { value: 0.18 },
      uExposure: { value: 1 },
    },
  });
}

export function createAtmosphereMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: atmosphereVertex,
    fragmentShader: atmosphereFragment,
    uniforms: {
      uLightDirection: { value: PLANET_LIGHT_DIRECTION.clone() },
      uRimColor: { value: RIM_COLOR.clone() },
      // |dot(n, v)| on the shell where the body's silhouette sits (orthographic approximation).
      uEdge: { value: Math.sqrt(1 - 1 / (ATMOSPHERE_SCALE * ATMOSPHERE_SCALE)) },
      uIntensity: { value: ATMOSPHERE_INTENSITY },
    },
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}
