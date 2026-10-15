import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, type Group, type Mesh } from 'three';
import { useMeridianStore } from '@/store';
import { getScenePhase, SUN_COVER_AT } from '../cameraPath';
import { setAnimating } from '../frameDemand';
import {
  ATMOSPHERE_INTENSITY,
  ATMOSPHERE_SCALE,
  createAtmosphereMaterial,
  createPlanetMaterial,
  planetQuality,
} from '../materials/planetMaterial';

/** Radians per second around the tilted axis: one revolution takes roughly three minutes. */
const ROTATION_SPEED = 0.035;
const AXIAL_TILT = 0.41;
const INITIAL_LONGITUDE = 2.1;
const ANIMATION_KEY = 'planet';
/*
 * Act IV tone: the closing headline, supporting line, CTA and footer sit over
 * the body, so its surface and halo are held low enough that light ink keeps
 * at least 4.5:1 against the brightest lit cloud behind it.
 */
const RETURN_SURFACE_GAIN = 0.42;
const RETURN_HALO_GAIN = 0.5;

export function Planet() {
  const tier = useMeridianStore((state) => state.tier);
  const quality = planetQuality[tier];
  const root = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const shell = useRef<Mesh>(null);

  const surface = useMemo(() => createPlanetMaterial(quality), [quality]);
  const atmosphere = useMemo(() => (quality.atmosphere ? createAtmosphereMaterial() : null), [quality]);

  useEffect(() => () => surface.dispose(), [surface]);
  useEffect(() => () => atmosphere?.dispose(), [atmosphere]);

  useFrame((_, delta) => {
    const state = useMeridianStore.getState();
    // The craft camera always looks away from the planet, and while the sun
    // starts to set its opaque disc still covers the whole frame in front of
    // the body: skip the body in both cases.
    const phase = getScenePhase(state);
    const covered = phase === 'return' && !state.reducedMotion && state.themeProgress >= SUN_COVER_AT;
    const shown = phase !== 'craft' && !covered;
    const pivot = root.current;
    if (pivot && pivot.visible !== shown) pivot.visible = shown;
    // Act IV: the body is lit but held down in tone behind the closing type.
    const gain = phase === 'return' ? RETURN_SURFACE_GAIN : 1;
    const surfaceMaterial = body.current?.material;
    const exposure = surfaceMaterial instanceof ShaderMaterial ? surfaceMaterial.uniforms.uExposure : undefined;
    if (exposure && exposure.value !== gain) exposure.value = gain;
    const haloMaterial = shell.current?.material;
    const halo = haloMaterial instanceof ShaderMaterial ? haloMaterial.uniforms.uIntensity : undefined;
    const haloValue = ATMOSPHERE_INTENSITY * (phase === 'return' ? RETURN_HALO_GAIN : 1);
    if (halo && halo.value !== haloValue) halo.value = haloValue;
    // Under reduced motion the body holds still and the cloud layer freezes.
    const turning = shown && !state.reducedMotion;
    setAnimating(ANIMATION_KEY, turning);
    if (!turning) return;
    const step = Math.min(delta, 0.1);
    const mesh = body.current;
    if (!mesh) return;
    mesh.rotation.y += ROTATION_SPEED * step;
    const time = mesh.material instanceof ShaderMaterial ? mesh.material.uniforms.uTime : undefined;
    if (time) time.value += step;
  });
  useEffect(() => () => setAnimating(ANIMATION_KEY, false), []);

  return (
    <group ref={root} rotation={[0, 0, AXIAL_TILT]}>
      <mesh ref={body} rotation={[0, INITIAL_LONGITUDE, 0]} material={surface}>
        <sphereGeometry args={[1, quality.widthSegments, quality.heightSegments]} />
      </mesh>
      {atmosphere ? (
        <mesh ref={shell} scale={ATMOSPHERE_SCALE} material={atmosphere} renderOrder={1}>
          <sphereGeometry args={[1, quality.widthSegments / 2, quality.heightSegments / 2]} />
        </mesh>
      ) : null}
    </group>
  );
}
