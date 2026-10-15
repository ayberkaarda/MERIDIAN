import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, ShaderMaterial, type Mesh, type Vector2, type WebGLRenderer } from 'three';
import { useMeridianStore } from '@/store';
import { getScenePhase, SUN_COVER_AT } from '../cameraPath';
import { createSunMaterial, sunQuality } from '../materials/sunMaterial';
import { fullscreenQuad } from '../materials/quadGeometry';
import { setAnimating } from '../frameDemand';

/*
 * The disc is laid out in half-height units so it behaves the same on any
 * aspect. It starts just below the bottom edge, then rises and grows until it
 * covers every corner of the viewport. Coverage completes slightly before
 * themeProgress reaches 1 so the frame is fully filled when the DOM flip lands.
 */
const START_RADIUS = 0.85; // times the half-diagonal
const END_CENTER_Y = -0.2;
const COVER_MARGIN = 1.02;
/** Surface detail fades into the flat page colour over this theme range. */
const FLATTEN_START = 0.62;
const FLATTEN_END = 1;
/** Scene exposure rises with the sun; at themeProgress 1 it is base * (1 + gain). */
const EXPOSURE_GAIN = 0.4;
/** Behind everything while it rises; over the planet and its halo while it sets. */
const RISE_RENDER_ORDER = -10;
const SET_RENDER_ORDER = 2;
const ANIMATION_KEY = 'sun';

function restoreExposure(renderer: WebGLRenderer | null, exposure: number | null): void {
  if (renderer && exposure !== null) renderer.toneMappingExposure = exposure;
}

export function SunBody() {
  const tier = useMeridianStore((state) => state.tier);
  const quality = sunQuality[tier];
  const gl = useThree((state) => state.gl);
  // Captured once: the renderer value is rewritten every frame from here on.
  const [initialExposure] = useState(() => gl.toneMappingExposure);
  const mesh = useRef<Mesh>(null);
  const renderer = useRef<WebGLRenderer | null>(null);

  const material = useMemo(() => createSunMaterial(quality), [quality]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => setAnimating(ANIMATION_KEY, false), []);

  // Hand the renderer back at the exposure it started with when the body unmounts.
  useEffect(() => () => restoreExposure(renderer.current, initialExposure), [initialExposure]);

  useFrame((frame, delta) => {
    const body = mesh.current;
    const sun = body?.material;
    if (!body || !(sun instanceof ShaderMaterial)) return;
    renderer.current = frame.gl;
    const state = useMeridianStore.getState();
    const theme = state.themeProgress;

    // Exposure crosses over on the same frame as the DOM theme mix.
    const exposure = initialExposure * (1 + EXPOSURE_GAIN * MathUtils.smoothstep(theme, 0, 1));
    if (frame.gl.toneMappingExposure !== exposure) frame.gl.toneMappingExposure = exposure;

    body.visible = theme > 0.0005;
    setAnimating(ANIMATION_KEY, body.visible && quality.animated && !state.reducedMotion);
    if (!body.visible) return;

    const { uniforms } = sun;
    const aspect = frame.size.width / Math.max(1, frame.size.height);
    const startRadius = START_RADIUS * Math.hypot(aspect, 1);
    const endRadius = Math.hypot(aspect, 1 - END_CENTER_Y) * COVER_MARGIN;
    const startY = -1 - startRadius - 0.02;
    const reduced = state.reducedMotion;
    // Reduced motion: no rise, the filled disc crossfades with the theme instead.
    const rise = reduced ? 1 : Math.min(1, theme / SUN_COVER_AT);

    const center = uniforms.uCenter?.value as Vector2 | undefined;
    center?.set(0, MathUtils.lerp(startY, END_CENTER_Y, rise));
    if (uniforms.uRadius) uniforms.uRadius.value = MathUtils.lerp(startRadius, endRadius, rise);
    if (uniforms.uAspect) uniforms.uAspect.value = aspect;
    if (uniforms.uOpacity) uniforms.uOpacity.value = reduced ? theme : 1;
    if (uniforms.uDetail) uniforms.uDetail.value = 1 - MathUtils.smoothstep(theme, FLATTEN_START, FLATTEN_END);
    if (uniforms.uTime && quality.animated && !reduced) uniforms.uTime.value += Math.min(delta, 0.1);

    // Rising in Act III the craft silhouettes against the disc. Setting in Act IV
    // the disc stays in front (after the atmosphere halo too), so the returning
    // planet is uncovered as it sinks.
    const setting = getScenePhase(state) === 'return';
    sun.depthTest = !setting;
    body.renderOrder = setting ? SET_RENDER_ORDER : RISE_RENDER_ORDER;
  });

  return (
    <mesh
      ref={mesh}
      geometry={fullscreenQuad}
      material={material}
      frustumCulled={false}
      renderOrder={RISE_RENDER_ORDER}
      visible={false}
    />
  );
}
