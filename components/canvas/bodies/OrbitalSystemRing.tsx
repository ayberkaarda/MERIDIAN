import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferGeometry as Geometry,
  type Group,
  type InstancedMesh,
  type LineBasicMaterial,
  type Object3D,
  type ShaderMaterial,
} from 'three';

export interface RingDefinition {
  radius: number;
  /** Inclination of the ring plane as [x, y, z] Euler angles. */
  inclination: readonly [number, number, number];
  /** Angular speed in rad/s at orbitProgress 0; inner rings run faster (Kepler-like). */
  speed: number;
  /** Where the label is anchored on the ring, in radians. */
  labelAngle: number;
  /** Seed for the deterministic body layout. */
  seed: number;
}

interface OrbitalSystemRingProps {
  ring: RingDefinition;
  bodyCount: number;
  segments: number;
  bodyGeometry: Geometry;
  bodyMaterial: ShaderMaterial;
  lineMaterial: LineBasicMaterial;
  /** Receives the spinning group so the parent can advance it in its own frame loop. */
  spinRef: (group: Group | null) => void;
  formationRef: (group: Group | null) => void;
  /** Receives the label anchor on the ring; the parent projects it to place the label. */
  anchorRef: (anchor: Object3D | null) => void;
  /** Optionally receives the ring line, which carries the shared hairline material. */
  lineRef?: (line: Object3D | null) => void;
}

/** Small deterministic PRNG so the belt layout is identical on every load and tier. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRingGeometry(radius: number, segments: number): BufferGeometry {
  const positions = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}

export function OrbitalSystemRing({
  ring,
  bodyCount,
  segments,
  bodyGeometry,
  bodyMaterial,
  lineMaterial,
  spinRef,
  formationRef,
  anchorRef,
  lineRef,
}: OrbitalSystemRingProps) {
  const bodies = useRef<InstancedMesh>(null);
  const loop = useMemo(() => createRingGeometry(ring.radius, segments), [ring.radius, segments]);
  useLayoutEffect(() => () => loop.dispose(), [loop]);

  // Bodies are laid out once; the whole belt turns as one group, so no
  // per-frame instance matrix uploads are needed.
  useLayoutEffect(() => {
    const mesh = bodies.current;
    if (!mesh) return;
    const random = mulberry32(ring.seed);
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const euler = new Euler();
    const scale = new Vector3();
    for (let i = 0; i < bodyCount; i += 1) {
      // Even spacing with jitter keeps the belt legible at every count.
      const angle = ((i + (random() - 0.5) * 0.7) / bodyCount) * Math.PI * 2;
      const radius = ring.radius + (random() - 0.5) * 0.08;
      position.set(Math.cos(angle) * radius, (random() - 0.5) * 0.05, Math.sin(angle) * radius);
      rotation.setFromEuler(euler.set(random() * Math.PI, random() * Math.PI, random() * Math.PI));
      // Mostly fine debris with an occasional larger module.
      const size = i % 7 === 0 ? 0.085 : 0.03 + random() * 0.035;
      scale.setScalar(size);
      mesh.setMatrixAt(i, matrix.compose(position, rotation, scale));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bodyCount, ring.radius, ring.seed]);

  const labelPosition = useMemo(
    () => [Math.cos(ring.labelAngle) * ring.radius, 0, Math.sin(ring.labelAngle) * ring.radius] as const,
    [ring.labelAngle, ring.radius],
  );

  return (
    <group ref={formationRef}>
    <group rotation={[ring.inclination[0], ring.inclination[1], ring.inclination[2]]}>
      <lineLoop ref={lineRef} geometry={loop} material={lineMaterial} />
      <group ref={spinRef}>
        <instancedMesh
          key={bodyCount}
          ref={bodies}
          args={[bodyGeometry, bodyMaterial, bodyCount]}
          frustumCulled={false}
        />
      </group>
      <object3D ref={anchorRef} position={labelPosition} />
    </group>
    </group>
  );
}
