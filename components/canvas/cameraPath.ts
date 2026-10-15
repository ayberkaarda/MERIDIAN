import { createCameraPose, interpolateCamera, type CameraKeyframe, type CameraPose } from '@/lib/camera';
import type { DeviceTier } from '@/lib/tiers';
import { useMeridianStore } from '@/store';
import type { CraftPart } from '@/data/inspections';

/**
 * World position of the MERIDIAN orbital core (Act II). It sits well off the
 * manifesto line of sight (~38 degrees on landscape, ~25 degrees on portrait,
 * both outside the frustum) and ~154 units from the manifesto camera, so the
 * system never competes with the faint planet before the orbit pin begins.
 */
export const ORBITAL_CORE_POSITION: readonly [number, number, number] = [60, -10, 340];

/*
 * Act I camera path. `at` is departureProgress (0..1 over the first 150vh).
 * The planet sits at the world origin with radius 1; the camera looks past it
 * so the body lands off-centre (right of the headline on landscape screens).
 *
 * Screen placement was solved per keyframe from distance d, fov and a 16:9
 * frame: target offset = -(screen fraction) * tan(fov / 2) * aspect * d.
 *
 *   at 0.0  Hero       d = 4.2   body fills ~80% of the height, right half of the frame
 *   at 0.5  Departure  d = 16    a small body drifting to the upper right
 *   at 1.0  Manifesto  d = 480   a faint point of light (~4px radius at 1080p)
 *
 * Act II frames are appended after `at` 1 and span orbitProgress (0..1 over the
 * 200vh orbital pin), mapped linearly onto [1, last.at] by the CameraRig:
 *
 *   at 1.4  Arrival    d = 14.1  the system lands right of centre, outer ring ~80% of the height
 *   at 2.0  Approach   d = 8.5   the camera has closed in, the outer ring bleeds off the frame
 *
 * The first Act II frame (arrival) is also the static Act II pose under reduced motion.
 */
export const cameraPath: CameraKeyframe[] = [
  { at: 0, position: [0, 0.1, 4.2], target: [-1.1, 0.2, 0], fov: 35 },
  { at: 0.5, position: [0, 0.6, 16], target: [-4.0, -0.9, 0], fov: 35 },
  { at: 1, position: [0, 12, 480], target: [-126, -42, 0], fov: 30 },
  // Core +0.25 of the half-width right of centre, viewed from slightly above the ring plane.
  { at: 1.4, position: [55.5, -6.8, 353], target: [58.14, -10, 339.36], fov: 35 },
  // Swings a few degrees round the core while closing in; core +0.18 right of centre.
  { at: 2, position: [56.17, -8.47, 347.44], target: [59.24, -10, 339.61], fov: 32 },
];

/*
 * Portrait variant (aspect ~0.46): on a phone the landscape offsets would push
 * the body out of frame, so it sits high and crops past the right edge instead,
 * leaving the lower half of the screen to the headline.
 *
 * Act II on portrait: the narrow horizontal field means the system is framed by
 * width. It is centred horizontally and sits in the upper part of the screen
 * (core +0.22 of the half-height above centre), leaving the lower half to type.
 */
export const cameraPathPortrait: CameraKeyframe[] = [
  { at: 0, position: [0, 0, 6.5], target: [-0.3, -0.72, 0], fov: 35 },
  { at: 0.5, position: [0, 0.4, 18], target: [-0.65, -2.15, 0], fov: 35 },
  { at: 1, position: [0, 8, 480], target: [-17.7, -62.7, 0], fov: 30 },
  // d = 24: the outer ring spans roughly the screen width.
  { at: 1.4, position: [52.81, -4.73, 362.28], target: [60, -11.66, 340], fov: 35 },
  // d = 15: the outer ring crops past both edges, the core holds the upper third.
  { at: 2, position: [53.99, -7.59, 353.53], target: [60, -10.95, 340], fov: 35 },
];

/** Aspect below which the portrait path should be used. */
export const PORTRAIT_ASPECT_THRESHOLD = 0.9;

/*
 * Act III: the spacecraft.
 *
 * The craft sits far off every earlier line of sight (more than 50 degrees off
 * the manifesto and orbital views) and is turned so its local +Z faces the
 * planet. The orbit then sweeps through the planet-facing half-space only: the
 * camera always looks away from the planet, so the body never shows up behind
 * the craft or over the rising sun.
 *
 * Orbit angle `theta` is measured around world Y from the craft's local +Z
 * towards its local +X (the engine end; the docking ring is at local -X).
 */
export const CRAFT_POSITION: readonly [number, number, number] = [140, 30, 300];
export const CRAFT_YAW = Math.atan2(-CRAFT_POSITION[0], -CRAFT_POSITION[2]);

type Vec3 = [number, number, number];

interface CraftOrbitFrame {
  /** Orbit angle in degrees. */
  theta: number;
  /** Elevation above the craft's horizontal plane in degrees. */
  elevation: number;
  radius: number;
  fov: number;
  /** Screen offset of the craft centre in half-width (x) and half-height (y) units. */
  shift: readonly [number, number];
}

interface CraftOrbit {
  from: CraftOrbitFrame;
  to: CraftOrbitFrame;
  /** Aspect the horizontal shift was solved for. */
  aspect: number;
}

/*
 * Landscape: a 180 degree sweep from a three-quarter view over the docking ring,
 * across the broadside of the radiator array, to a three-quarter view of the
 * engine. The camera descends towards the craft's plane but stays above it (so
 * the upper face of the bus stays in view) and closes in a little; the craft
 * holds right of centre. The first frame is also
 * the static pose under reduced motion, and shows all three label anchors.
 */
const CRAFT_ORBIT: CraftOrbit = {
  from: { theta: -60, elevation: 14, radius: 13, fov: 35, shift: [0.16, 0] },
  to: { theta: 120, elevation: 6, radius: 11.2, fov: 32, shift: [0.16, 0] },
  aspect: 16 / 9,
};

/* Portrait: framed by width, the craft is centred and held in the upper part of the screen. */
const CRAFT_ORBIT_PORTRAIT: CraftOrbit = {
  from: { theta: -60, elevation: 14, radius: 26, fov: 40, shift: [0, 0.26] },
  to: { theta: 120, elevation: 6, radius: 23, fov: 40, shift: [0, 0.26] },
  aspect: 0.46,
};

/*
 * Low tier: two keyframes over a shorter 70 degree arc. A linear blend between
 * diametrically opposite poses would pass through the craft, so the arc stays
 * short enough that the chord only reads as a gentle dolly-in.
 */
const CRAFT_LOW: CraftOrbit = {
  from: { theta: -45, elevation: 10, radius: 13, fov: 35, shift: [0.16, 0] },
  to: { theta: 25, elevation: 6, radius: 12, fov: 34, shift: [0.16, 0] },
  aspect: 16 / 9,
};

const CRAFT_LOW_PORTRAIT: CraftOrbit = {
  from: { theta: -45, elevation: 10, radius: 29, fov: 40, shift: [0, 0.26] },
  to: { theta: 25, elevation: 6, radius: 27, fov: 40, shift: [0, 0.26] },
  aspect: 0.46,
};

const DEG = Math.PI / 180;
const yawCos = Math.cos(CRAFT_YAW);
const yawSin = Math.sin(CRAFT_YAW);

/** Rotates a craft-local vector into world space (yaw around Y). */
export function craftLocalToWorld(local: readonly [number, number, number], result: Vec3 = [0, 0, 0]): Vec3 {
  const [x, y, z] = local;
  result[0] = CRAFT_POSITION[0] + x * yawCos + z * yawSin;
  result[1] = CRAFT_POSITION[1] + y;
  result[2] = CRAFT_POSITION[2] - x * yawSin + z * yawCos;
  return result;
}

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

// Same cubic as the camera's power2.inOut.
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const orbitOffset: Vec3 = [0, 0, 0];

/** Writes the pose for one orbit frame (angles in degrees) into `result`. */
function solveOrbitPose(frame: CraftOrbitFrame, aspect: number, result: CameraPose): CameraPose {
  const theta = frame.theta * DEG;
  const elevation = frame.elevation * DEG;
  const flat = Math.cos(elevation);
  orbitOffset[0] = Math.sin(theta) * flat * frame.radius;
  orbitOffset[1] = Math.sin(elevation) * frame.radius;
  orbitOffset[2] = Math.cos(theta) * flat * frame.radius;
  const position = craftLocalToWorld(orbitOffset, result.position);
  // Camera basis looking at the craft centre.
  let fx = CRAFT_POSITION[0] - position[0];
  let fy = CRAFT_POSITION[1] - position[1];
  let fz = CRAFT_POSITION[2] - position[2];
  const distance = Math.hypot(fx, fy, fz) || 1;
  fx /= distance;
  fy /= distance;
  fz /= distance;
  // right = forward x up(0,1,0); up' = right x forward.
  let rx = -fz;
  let rz = fx;
  const rightLength = Math.hypot(rx, rz) || 1;
  rx /= rightLength;
  rz /= rightLength;
  const ux = -rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy;
  // Shift the aim opposite to where the craft should land on screen.
  const halfHeight = Math.tan((frame.fov * DEG) / 2) * distance;
  const sideShift = frame.shift[0] * halfHeight * aspect;
  const liftShift = frame.shift[1] * halfHeight;
  result.target[0] = CRAFT_POSITION[0] - rx * sideShift - ux * liftShift;
  result.target[1] = CRAFT_POSITION[1] - uy * liftShift;
  result.target[2] = CRAFT_POSITION[2] - rz * sideShift - uz * liftShift;
  result.fov = frame.fov;
  return result;
}

const blendFrame: CraftOrbitFrame & { shift: [number, number] } = {
  theta: 0,
  elevation: 0,
  radius: 0,
  fov: 35,
  shift: [0, 0],
};

function solveOrbit(orbit: CraftOrbit, t: number, result: CameraPose): CameraPose {
  const { from, to } = orbit;
  blendFrame.theta = mix(from.theta, to.theta, t);
  blendFrame.elevation = mix(from.elevation, to.elevation, t);
  blendFrame.radius = mix(from.radius, to.radius, t);
  blendFrame.fov = mix(from.fov, to.fov, t);
  blendFrame.shift[0] = mix(from.shift[0], to.shift[0], t);
  blendFrame.shift[1] = mix(from.shift[1], to.shift[1], t);
  return solveOrbitPose(blendFrame, orbit.aspect, result);
}

function toKeyframes(orbit: CraftOrbit): CameraKeyframe[] {
  return [0, 1].map((at) => {
    const pose = solveOrbit(orbit, at, createCameraPose());
    return { at, position: pose.position, target: pose.target, fov: pose.fov };
  });
}

/** The two low-tier keyframes (craftProgress 0 and 1). */
export const craftCameraPathLow: CameraKeyframe[] = toKeyframes(CRAFT_LOW);
export const craftCameraPathLowPortrait: CameraKeyframe[] = toKeyframes(CRAFT_LOW_PORTRAIT);

export interface CraftCameraOptions {
  portrait?: boolean;
  /** Defaults to the tier in the store. */
  tier?: DeviceTier;
  /** Pose object to write into; one shared pose is reused when omitted. */
  result?: CameraPose;
}

const sharedCraftPose = createCameraPose();

/**
 * Camera pose for Act III at craftProgress (0..1 across the spacecraft pin).
 * High and mid tiers orbit 180 degrees around the craft with power2.inOut
 * easing; the low tier blends its two keyframes. Allocation free: the pose is
 * written into `options.result` or a shared object. Under reduced motion pass
 * progress 0: the first frame is the static composition.
 */
export function getCraftCamera(progress: number, options: CraftCameraOptions = {}): CameraPose {
  const result = options.result ?? sharedCraftPose;
  const tier = options.tier ?? useMeridianStore.getState().tier;
  const portrait = options.portrait ?? false;
  const t = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  if (tier === 'low') {
    return interpolateCamera(portrait ? craftCameraPathLowPortrait : craftCameraPathLow, t, result);
  }
  solveOrbit(portrait ? CRAFT_ORBIT_PORTRAIT : CRAFT_ORBIT, easeInOut(t), result);
  result.at = t;
  return result;
}

/*
 * Act IV: the hero planet returns, larger and closer than in Act I (d = 2.9
 * against 4.2), under the same key light. The camera has also swung ~24
 * degrees round towards that light, so the body comes back in fuller light
 * (phase angle ~45 degrees against ~70 in the hero): the journey closes on the
 * lit face. Landscape: the disc overfills the frame height, its centre ~10
 * degrees right of the view axis and a touch low, the lit limb just at the
 * right edge. Portrait: d = 4.6 against 6.5; wider than the screen, the body
 * sits high (centre ~7 degrees above the axis) above the headline.
 *
 * The return begins at the top of the sun-set range, while the sun disc still
 * covers the whole frame, so the cut from the craft to the planet is never
 * seen. As the sun sinks (themeProgress 1 -> 0) the camera settles a short way
 * in from a slightly wider approach pose; once the sun is down the final pose
 * holds for the rest of the page. Reduced motion uses the final pose only.
 */
export const returnCameraPose: CameraPose = { at: 0, position: [1.2, 0.15, 2.65], target: [-0.444, 0.102, 0.245], fov: 35 };
export const returnCameraPosePortrait: CameraPose = { at: 0, position: [1.886, 0.23, 4.186], target: [-0.188, -0.558, 0.16], fov: 35 };
/* Approach poses: the same viewing direction and screen offsets, ~15% farther out. */
const returnApproachPose: CameraPose = { at: 0, position: [1.38, 0.1725, 3.0475], target: [-0.511, 0.117, 0.281], fov: 35 };
const returnApproachPosePortrait: CameraPose = { at: 0, position: [2.173, 0.265, 4.823], target: [-0.216, -0.643, 0.184], fov: 35 };

const sharedReturnPose = createCameraPose();

/**
 * Camera pose for Act IV. `settle` runs 0..1 as the sun sets (1 = final pose,
 * the default). Allocation free: the pose is written into `result` or a shared
 * object.
 */
export function getReturnCamera(portrait = false, settle = 1, result: CameraPose = sharedReturnPose): CameraPose {
  const from = portrait ? returnApproachPosePortrait : returnApproachPose;
  const to = portrait ? returnCameraPosePortrait : returnCameraPose;
  const t = easeInOut(Number.isFinite(settle) ? Math.min(1, Math.max(0, settle)) : 1);
  for (let axis = 0; axis < 3; axis += 1) {
    result.position[axis] = mix(from.position[axis] ?? 0, to.position[axis] ?? 0, t);
    result.target[axis] = mix(from.target[axis] ?? 0, to.target[axis] ?? 0, t);
  }
  result.fov = mix(from.fov, to.fov, t);
  result.at = t;
  return result;
}

/*
 * Scene phase: which body the camera is on. `return` starts either with the
 * Act IV section or, earlier, at the top of the sun-set range (written by the
 * CameraRig from a scroll trigger), so the craft never reappears while the sun
 * goes down and the act boundary itself causes no cut.
 */
export type ScenePhase = 'path' | 'craft' | 'return';

/** themeProgress from which the sun disc (with motion) covers the whole viewport. */
export const SUN_COVER_AT = 0.94;

interface PhaseInputs {
  activeAct: string;
  returnPhaseActive?: boolean;
  craftProgress: number;
}

export function getScenePhase(state: PhaseInputs): ScenePhase {
  if (state.activeAct === 'return' || state.returnPhaseActive) return 'return';
  if (state.activeAct === 'arrival' || state.craftProgress > 0) return 'craft';
  return 'path';
}

const orbitInspectionPose: CameraPose = { at: 0, position: [55.5, -6.8, 353], target: [58.14, -10, 339.36], fov: 35 };
const orbitInspectionPortrait: CameraPose = { at: 0, position: [50.1, -2.75, 370.6], target: [60, -11.5, 340], fov: 35 };

export function getOrbitInspectionCamera(portrait: boolean): CameraPose {
  return portrait ? orbitInspectionPortrait : orbitInspectionPose;
}

const inspectionFrames: Record<CraftPart, CraftOrbitFrame> = {
  radiator: { theta: -25, elevation: 32, radius: 11, fov: 35, shift: [0.3, 0.12] },
  docking: { theta: -68, elevation: 18, radius: 8.5, fov: 35, shift: [0.3, 0.12] },
  bus: { theta: -15, elevation: 32, radius: 10, fov: 35, shift: [0.3, 0.12] },
};
const inspectionPortraitFrames: Record<CraftPart, CraftOrbitFrame> = {
  radiator: { theta: -25, elevation: 32, radius: 19, fov: 40, shift: [0, 0.2] },
  docking: { theta: -68, elevation: 18, radius: 16, fov: 40, shift: [0, 0.2] },
  bus: { theta: -15, elevation: 32, radius: 17, fov: 40, shift: [0, 0.2] },
};
const inspectionTargets: Record<CraftPart, Vec3> = {
  radiator: [0.25, 0.15, 1.9], docking: [-3.8, 0, 0], bus: [0.25, 0.55, 0],
};
const inspectionPose = createCameraPose();
const inspectionWorld: Vec3 = [0, 0, 0];

export function getCraftInspectionCamera(part: CraftPart, portrait: boolean): CameraPose {
  const frame = (portrait ? inspectionPortraitFrames : inspectionFrames)[part];
  solveOrbitPose(frame, portrait ? 0.46 : 16 / 9, inspectionPose);
  craftLocalToWorld(inspectionTargets[part], inspectionWorld);
  for (let axis = 0; axis < 3; axis += 1) {
    const offset = (inspectionWorld[axis] ?? 0) - (CRAFT_POSITION[axis] ?? 0);
    inspectionPose.position[axis] = (inspectionPose.position[axis] ?? 0) + offset;
    inspectionPose.target[axis] = (inspectionPose.target[axis] ?? 0) + offset;
  }
  return inspectionPose;
}
