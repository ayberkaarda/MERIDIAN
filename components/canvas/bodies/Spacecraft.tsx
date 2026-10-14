import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, type DirectionalLight, type Group, type Object3D } from 'three';
import { useMeridianStore } from '@/store';
import { CRAFT_POSITION, CRAFT_YAW } from '../cameraPath';
import {
  CRAFT_FILL,
  CRAFT_KEY,
  CRAFT_RIM,
  craftQuality,
  createCraftMaterial,
  updateCraftShading,
} from '../materials/craftMaterial';

/** Hull sections that run along the long axis (cylinder Y turned onto X; +Y ends up at -X). */
const ALONG_X: [number, number, number] = [0, 0, Math.PI / 2];
/** Cylinder Y turned onto Z, for the radiator spine. */
const ALONG_Z: [number, number, number] = [Math.PI / 2, 0, 0];
/** Torus normal turned onto X, so the docking ring faces forward. */
const FACING_X: [number, number, number] = [0, Math.PI / 2, 0];

/** Radiator panel centres along X; each wing carries four panels with gaps between them. */
const PANEL_X = [-0.66, -0.1, 0.46, 1.02] as const;
const PANEL_SIZE: [number, number, number] = [0.5, 0.03, 2.1];
/** Wing centre offset along Z: bus radius, a short root gap and half a panel. */
const WING_Z = 1.66;

/** Theme range over which the craft washes into the page colour as the sun disc fills the frame. */
const WASH_START = 0.5;
const WASH_END = 0.97;
/** The rim brightens as the sun rises behind the craft. */
const RIM_GAIN = 1.2;

function aimLight(light: DirectionalLight | null, target: Object3D): void {
  if (light && light.target !== target) light.target = target;
}

export function Spacecraft() {
  const tier = useMeridianStore((state) => state.tier);
  const quality = craftQuality[tier];
  const { gl, camera, scene } = useThree();

  const root = useRef<Group>(null);
  const hull = useRef<Group>(null);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);

  const materials = useMemo(
    () => ({
      hull: createCraftMaterial('hull', quality),
      radiator: createCraftMaterial('radiator', quality),
      dark: createCraftMaterial('dark', quality),
    }),
    [quality],
  );
  useEffect(
    () => () => {
      materials.hull.dispose();
      materials.radiator.dispose();
      materials.dark.dispose();
    },
    [materials],
  );

  // Compile the craft programs ahead of Act III so the first frame of the pin
  // does not stall; the lights stay visible, so the light setup matches.
  useEffect(() => {
    const group = hull.current;
    if (!group) return;
    gl.compileAsync(group, camera, scene).catch(() => undefined);
  }, [gl, camera, scene, materials]);

  useFrame((frame) => {
    const group = hull.current;
    const centre = root.current;
    if (!group || !centre) return;
    // Directional lights aim at the craft centre rather than the world origin.
    aimLight(key.current, centre);
    aimLight(fill.current, centre);
    aimLight(rim.current, centre);
    const state = useMeridianStore.getState();
    // The craft belongs to Act III and leaves as the sun disc fills the frame.
    const theme = state.themeProgress;
    const wash = MathUtils.smoothstep(theme, WASH_START, WASH_END);
    group.visible = state.activeAct === 'arrival' && wash < 0.999;
    if (!group.visible) return;
    const rimGain = 1 + RIM_GAIN * theme;
    if (rim.current) rim.current.intensity = CRAFT_RIM.intensity * rimGain;
    updateCraftShading(frame.camera.matrixWorldInverse, CRAFT_YAW, rimGain, wash);
  });

  const radial = quality.radialSegments;
  const [ringRadial, ringTube] = quality.ringSegments;

  return (
    <group ref={root} position={[...CRAFT_POSITION]} rotation={[0, CRAFT_YAW, 0]}>
      <directionalLight ref={key} position={[...CRAFT_KEY.position]} color={CRAFT_KEY.color} intensity={CRAFT_KEY.intensity} />
      <directionalLight ref={fill} position={[...CRAFT_FILL.position]} color={CRAFT_FILL.color} intensity={CRAFT_FILL.intensity} />
      <directionalLight ref={rim} position={[...CRAFT_RIM.position]} color={CRAFT_RIM.color} intensity={CRAFT_RIM.intensity} />
      <group ref={hull} visible={false}>
        {/* Docking ring and collar at the nose. */}
        <mesh position={[-3.45, 0, 0]} rotation={FACING_X} material={materials.hull}>
          <torusGeometry args={[0.34, 0.055, ringTube, ringRadial]} />
        </mesh>
        <mesh position={[-3.28, 0, 0]} rotation={ALONG_X} material={materials.dark}>
          <cylinderGeometry args={[0.24, 0.26, 0.32, radial]} />
        </mesh>
        {/* Tapered nose, habitat module and neck. */}
        <mesh position={[-2.9, 0, 0]} rotation={ALONG_X} material={materials.hull}>
          <cylinderGeometry args={[0.3, 0.56, 0.5, radial]} />
        </mesh>
        <mesh position={[-1.9, 0, 0]} rotation={ALONG_X} material={materials.hull}>
          <cylinderGeometry args={[0.56, 0.56, 1.5, radial]} />
        </mesh>
        <mesh position={[-1.0, 0, 0]} rotation={ALONG_X} material={materials.dark}>
          <cylinderGeometry args={[0.36, 0.4, 0.3, radial]} />
        </mesh>
        {/* Main bus: a hexagonal prism carrying the radiator wings. */}
        <mesh position={[0.25, 0, 0]} rotation={ALONG_X} material={materials.hull}>
          <cylinderGeometry args={[0.46, 0.46, 2.4, 6]} />
        </mesh>
        {/* Radiator array: two wings of three panels, edge-on along +/-Z. */}
        {[-1, 1].flatMap((side) =>
          PANEL_X.map((x) => (
            <mesh key={`${side}:${x}`} position={[x, 0, side * WING_Z]} material={materials.radiator}>
              <boxGeometry args={PANEL_SIZE} />
            </mesh>
          )),
        )}
        {/* Aft truss, propellant tank and the open engine bell. */}
        <mesh position={[1.9, 0, 0]} rotation={ALONG_X} material={materials.dark}>
          <cylinderGeometry args={[0.18, 0.18, 0.9, radial]} />
        </mesh>
        <mesh position={[2.55, 0, 0]} rotation={ALONG_X} material={materials.hull}>
          <cylinderGeometry args={[0.42, 0.42, 0.5, radial]} />
        </mesh>
        <mesh position={[3.15, 0, 0]} rotation={ALONG_X} material={materials.dark}>
          <cylinderGeometry args={[0.2, 0.48, 0.7, radial, 1, true]} />
        </mesh>
        {quality.details ? (
          <>
            {/* Radiator spine through the bus. */}
            <mesh position={[0.3, 0, 0]} rotation={ALONG_Z} material={materials.dark}>
              <cylinderGeometry args={[0.035, 0.035, 2 * (WING_Z + PANEL_SIZE[2] / 2), 6]} />
            </mesh>
            {/* High-gain antenna on the upper face of the bus. */}
            <mesh position={[0.85, 0.52, 0]} material={materials.dark}>
              <cylinderGeometry args={[0.025, 0.025, 0.22, 6]} />
            </mesh>
            <mesh position={[0.85, 0.68, 0]} material={materials.radiator}>
              <cylinderGeometry args={[0.3, 0.05, 0.12, radial]} />
            </mesh>
            {/* Secondary tank ring between bus and truss. */}
            <mesh position={[1.5, 0, 0]} rotation={FACING_X} material={materials.hull}>
              <torusGeometry args={[0.32, 0.07, ringTube, ringRadial]} />
            </mesh>
          </>
        ) : null}
      </group>
    </group>
  );
}
