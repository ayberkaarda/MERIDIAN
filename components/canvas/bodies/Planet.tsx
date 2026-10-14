import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, type Mesh } from 'three';
import { useMeridianStore } from '@/store';
import {
  ATMOSPHERE_SCALE,
  createAtmosphereMaterial,
  createPlanetMaterial,
  planetQuality,
} from '../materials/planetMaterial';

/** Radians per second around the tilted axis: one revolution takes roughly three minutes. */
const ROTATION_SPEED = 0.035;
const AXIAL_TILT = 0.41;
const INITIAL_LONGITUDE = 2.1;

export function Planet() {
  const tier = useMeridianStore((state) => state.tier);
  const quality = planetQuality[tier];
  const body = useRef<Mesh>(null);

  const surface = useMemo(() => createPlanetMaterial(quality), [quality]);
  const atmosphere = useMemo(() => (quality.atmosphere ? createAtmosphereMaterial() : null), [quality]);

  useEffect(() => () => surface.dispose(), [surface]);
  useEffect(() => () => atmosphere?.dispose(), [atmosphere]);

  useFrame((_, delta) => {
    // Under reduced motion the body holds still and the cloud layer freezes.
    if (useMeridianStore.getState().reducedMotion) return;
    const step = Math.min(delta, 0.1);
    const mesh = body.current;
    if (!mesh) return;
    mesh.rotation.y += ROTATION_SPEED * step;
    const time = mesh.material instanceof ShaderMaterial ? mesh.material.uniforms.uTime : undefined;
    if (time) time.value += step;
  });

  return (
    <group rotation={[0, 0, AXIAL_TILT]}>
      <mesh ref={body} rotation={[0, INITIAL_LONGITUDE, 0]} material={surface}>
        <sphereGeometry args={[1, quality.widthSegments, quality.heightSegments]} />
      </mesh>
      {atmosphere ? (
        <mesh scale={ATMOSPHERE_SCALE} material={atmosphere} renderOrder={1}>
          <sphereGeometry args={[1, quality.widthSegments / 2, quality.heightSegments / 2]} />
        </mesh>
      ) : null}
    </group>
  );
}
