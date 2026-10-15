import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  EdgesGeometry,
  IcosahedronGeometry,
  LineBasicMaterial,
  MathUtils,
  OctahedronGeometry,
  ShaderMaterial,
  Vector3,
  type Group,
  type LineSegments,
  type Mesh,
  type Object3D,
} from 'three';
import { publishOrbitalLabelPoints, useMeridianStore } from '@/store';
import { getScenePhase, ORBITAL_CORE_POSITION } from '../cameraPath';
import { createFacetMaterial, createLineMaterial, orbitalQuality } from '../materials/orbitalMaterial';
import { OrbitalSystemRing, type RingDefinition } from './OrbitalSystemRing';
import { publishSceneLabels } from './sceneLabels';
import { setAnimating } from '../frameDemand';
import { inspectionDuration, inspectionEase } from '../inspectionMotion';

const RINGS: readonly RingDefinition[] = [
  { radius: 1.9, inclination: [0.34, 0, 0.1], speed: 0.3, labelAngle: -0.35, seed: 101 },
  { radius: 2.75, inclination: [-0.22, 0.4, -0.36], speed: 0.17, labelAngle: 0.25, seed: 202 },
  { radius: 3.6, inclination: [0.56, -0.3, 0.22], speed: 0.1, labelAngle: -0.15, seed: 303 },
];

/** Resting attitude of the whole system: a slight three-quarter view of the ring planes. */
const BASE_ATTITUDE = [0.12, 0, -0.06] as const;
/** Pointer tilt limit, ±6 degrees. */
const MAX_TILT = MathUtils.degToRad(6);
const TILT_DAMPING = 2.4;
/** Scroll through the orbital pin raises ring speed up to 1 + this factor. */
const SPEED_GAIN = 2.4;
const SPEED_DAMPING = 1.6;
const CORE_SPIN = 0.05;
const LATTICE_SPIN = -0.03;
const RING_OPACITY = 0.3;
const LATTICE_OPACITY = 0.2;
/** Camera distances (world units) over which the system and its labels fade in. */
const FADE_FAR = 110;
const FADE_NEAR = 50;
const LABEL_FAR = 40;
const LABEL_NEAR = 26;
/** orbitProgress at which the labels start to leave with the end of the pin. */
const LABEL_EXIT_START = 0.9;
/** orbitProgress at which the whole system starts to fade out of the pin. */
const SYSTEM_EXIT_START = 0.88;

const core = new Vector3(...ORBITAL_CORE_POSITION);
const ANIMATION_KEY = 'orbital';

/** Facet materials take the fade as a uniform, hairlines as opacity. */
function applyFade(object: Object3D | null | undefined, value: number): void {
  if (!object || !('material' in object)) return;
  const { material } = object;
  if (material instanceof ShaderMaterial) {
    const uniform = material.uniforms.uFade;
    if (uniform) uniform.value = value;
  } else if (material instanceof LineBasicMaterial) {
    material.opacity = value;
  }
}

export function OrbitalSystem() {
  const tier = useMeridianStore((state) => state.tier);
  const quality = orbitalQuality[tier];

  const root = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const coreBody = useRef<Group>(null);
  const lattice = useRef<Group>(null);
  const coreMesh = useRef<Mesh>(null);
  const latticeLines = useRef<LineSegments>(null);
  const ringLine = useRef<Object3D | null>(null);
  const spins = useRef<(Group | null)[]>([]);
  const formations = useRef<(Group | null)[]>([]);
  const formationState = useRef({
    selected: null as number | null,
    elapsed: inspectionDuration,
    tiltX: 0,
    tiltY: 0,
    poses: RINGS.map(() => ({ fromPosition: new Vector3(), toPosition: new Vector3(), fromRotation: new Vector3(), toRotation: new Vector3(), fromScale: 1, toScale: 1 })),
  });
  const anchors = useRef<(Object3D | null)[]>([]);
  const speed = useRef(1);
  const drift = useRef(0);

  const coreMaterial = useMemo(() => createFacetMaterial('core'), []);
  const bodyMaterial = useMemo(() => createFacetMaterial('body'), []);
  const ringMaterial = useMemo(() => createLineMaterial(), []);
  const latticeMaterial = useMemo(() => createLineMaterial(), []);
  const coreGeometry = useMemo(() => new IcosahedronGeometry(0.55, quality.coreDetail), [quality.coreDetail]);
  const latticeGeometry = useMemo(() => {
    const shell = new IcosahedronGeometry(0.8, 0);
    const edges = new EdgesGeometry(shell);
    shell.dispose();
    return edges;
  }, []);
  const bodyGeometry = useMemo(() => new OctahedronGeometry(1, 0), []);

  useEffect(
    () => () => {
      coreMaterial.dispose();
      bodyMaterial.dispose();
      ringMaterial.dispose();
      latticeMaterial.dispose();
    },
    [coreMaterial, bodyMaterial, ringMaterial, latticeMaterial],
  );
  useEffect(() => () => coreGeometry.dispose(), [coreGeometry]);
  useEffect(() => () => latticeGeometry.dispose(), [latticeGeometry]);
  useEffect(() => () => bodyGeometry.dispose(), [bodyGeometry]);
  useEffect(() => () => {
    setAnimating(ANIMATION_KEY, false);
    const state = useMeridianStore.getState();
    state.orbitalLabelOpacity = 0;
    for (const point of state.orbitalLabelPoints) point.visible = false;
    publishOrbitalLabelPoints();
  }, []);

  const spinRefs = useMemo(
    () => RINGS.map((_, index) => (group: Group | null) => { spins.current[index] = group; }),
    [],
  );
  const formationRefs = useMemo(() => RINGS.map((_, index) => (group: Group | null) => { formations.current[index] = group; }), []);
  const anchorRefs = useMemo(
    () => RINGS.map((_, index) => (anchor: Object3D | null) => { anchors.current[index] = anchor; }),
    [],
  );
  const setRingLine = useCallback((line: Object3D | null) => {
    ringLine.current = line;
  }, []);

  useFrame(({ camera, size }, delta) => {
    const formation = formationState.current;
    const group = root.current;
    if (!group) return;
    const state = useMeridianStore.getState();
    const step = Math.min(delta, 0.1);
    const selected = state.activeAct === 'transit' ? state.selectedOrbit : null;
    if (formation.selected !== selected) {
      formation.selected = selected;
      formation.elapsed = 0;
      formation.tiltX = tilt.current?.rotation.x ?? 0;
      formation.tiltY = tilt.current?.rotation.y ?? 0;
      for (let index = 0; index < RINGS.length; index += 1) {
        const node = formations.current[index];
        const target = formation.poses[index];
        if (!node || !target) continue;
        target.fromPosition.copy(node.position);
        target.fromRotation.set(node.rotation.x, node.rotation.y, node.rotation.z);
        target.fromScale = node.scale.x;
        const chosen = index === selected;
        target.toPosition.set(selected === null ? 0 : chosen ? 0 : (index - selected) * 0.75, selected === null ? 0 : chosen ? 0.2 : (index - selected) * 0.65, selected === null ? 0 : chosen ? 1.4 : -0.9);
        target.toRotation.set(selected === null ? 0 : chosen ? 0.6 : -0.15, selected === null ? 0 : chosen ? -0.2 : 0.16 * (index - (selected ?? 0)), 0);
        target.toScale = selected === null || chosen ? 1 : 0.78;
      }
    }
    formation.elapsed = state.reducedMotion ? inspectionDuration : Math.min(inspectionDuration, formation.elapsed + step);
    const assembled = inspectionEase(formation.elapsed / inspectionDuration);
    for (let index = 0; index < RINGS.length; index += 1) {
      const node = formations.current[index];
      const target = formation.poses[index];
      if (!node || !target) continue;
      node.position.lerpVectors(target.fromPosition, target.toPosition, assembled);
      node.rotation.set(
        MathUtils.lerp(target.fromRotation.x, target.toRotation.x, assembled),
        MathUtils.lerp(target.fromRotation.y, target.toRotation.y, assembled),
        MathUtils.lerp(target.fromRotation.z, target.toRotation.z, assembled),
      );
      node.scale.setScalar(MathUtils.lerp(target.fromScale, target.toScale, assembled));
    }

    // Fade by camera distance: the system is out of view and culled during Act I.
    const distance = camera.position.distanceTo(core);
    // The system also leaves with the end of the orbital pin, so it does not sit
    // behind the timeline and technology sections (orbitProgress holds at 1 there).
    const approachFade = MathUtils.smoothstep(FADE_FAR - distance, 0, FADE_FAR - FADE_NEAR);
    const exitFade = 1 - MathUtils.smoothstep(state.orbitProgress, SYSTEM_EXIT_START, 1);
    const fade = selected !== null ? 1 : approachFade * exitFade;
    // Nothing of the system is drawn outside the camera path (craft, return).
    group.visible = fade > 0.001 && getScenePhase(state) === 'path';
    // Labels belong to the orbital pin only: hidden before it, faded out over its
    // last stretch and kept hidden through the timeline and technology sections.
    const inOrbit = state.activeAct === 'transit' && (selected !== null || (state.orbitProgress > 0 && state.orbitProgress < 1));
    const labelExit = 1 - MathUtils.smoothstep(state.orbitProgress, LABEL_EXIT_START, 1);
    const labelApproach = MathUtils.smoothstep(LABEL_FAR - distance, 0, LABEL_FAR - LABEL_NEAR);
    const opacity = group.visible && inOrbit ? selected !== null ? 1 : labelApproach * labelExit : 0;
    publishSceneLabels(anchors.current, camera, size.width, size.height, opacity);
    // Rings turn and the attitude drifts on their own unless motion is reduced.
    setAnimating(ANIMATION_KEY, group.visible && ((!state.reducedMotion && selected === null) || assembled < 1));
    if (!group.visible) return;

    // Materials are shared, so fading one object of each kind fades them all.
    applyFade(coreMesh.current, fade);
    applyFade(spins.current[0]?.children[0], fade);
    applyFade(ringLine.current, RING_OPACITY * fade);
    applyFade(latticeLines.current, LATTICE_OPACITY * fade);

    const reduced = state.reducedMotion || selected !== null;
    // Reduced motion: rings come to rest and the system holds its resting attitude.
    const targetSpeed = reduced ? 0 : 1 + SPEED_GAIN * state.orbitProgress;
    speed.current = reduced ? 0 : MathUtils.damp(speed.current, targetSpeed, SPEED_DAMPING, step);

    const pivot = tilt.current;
    if (pivot) {
      let tiltX = 0;
      let tiltY = 0;
      if (!reduced) {
        // Touch, a hidden pointer and the low tier get a slow autonomous drift.
        if (tier === 'low' || !state.pointer.visible) {
          drift.current += step;
          tiltX = MAX_TILT * 0.6 * Math.sin(drift.current * 0.09);
          tiltY = MAX_TILT * 0.8 * Math.sin(drift.current * 0.061 + 1.3);
        } else {
          tiltX = -state.pointer.normalizedY * MAX_TILT;
          tiltY = state.pointer.normalizedX * MAX_TILT;
        }
      }
      pivot.rotation.x = state.reducedMotion ? 0 : selected !== null ? MathUtils.lerp(formation.tiltX, 0, assembled) : MathUtils.damp(pivot.rotation.x, tiltX, TILT_DAMPING, step);
      pivot.rotation.y = state.reducedMotion ? 0 : selected !== null ? MathUtils.lerp(formation.tiltY, 0, assembled) : MathUtils.damp(pivot.rotation.y, tiltY, TILT_DAMPING, step);
    }

    if (speed.current === 0) return;
    const advance = speed.current * step;
    for (let index = 0; index < RINGS.length; index += 1) {
      const spin = spins.current[index];
      const ring = RINGS[index];
      if (spin && ring) spin.rotation.y += ring.speed * advance;
    }
    if (coreBody.current) coreBody.current.rotation.y += CORE_SPIN * advance;
    if (lattice.current) lattice.current.rotation.y += LATTICE_SPIN * advance;
  });

  return (
    <group ref={root} position={[...ORBITAL_CORE_POSITION]} visible={false}>
      <group ref={tilt}>
        <group rotation={[...BASE_ATTITUDE]}>
          <group ref={coreBody}>
            <mesh ref={coreMesh} geometry={coreGeometry} material={coreMaterial} />
          </group>
          <group ref={lattice} rotation={[0.4, 0, 0.2]}>
            <lineSegments ref={latticeLines} geometry={latticeGeometry} material={latticeMaterial} />
          </group>
          {RINGS.map((ring, index) => (
            <OrbitalSystemRing
              key={ring.seed}
              ring={ring}
              bodyCount={quality.bodies[index] ?? 0}
              segments={quality.ringSegments}
              bodyGeometry={bodyGeometry}
              bodyMaterial={bodyMaterial}
              lineMaterial={ringMaterial}
              spinRef={spinRefs[index] ?? (() => undefined)}
              formationRef={formationRefs[index] ?? (() => undefined)}
              anchorRef={anchorRefs[index] ?? (() => undefined)}
              lineRef={index === 0 ? setRingLine : undefined}
            />
          ))}
        </group>
      </group>
    </group>
  );
}
