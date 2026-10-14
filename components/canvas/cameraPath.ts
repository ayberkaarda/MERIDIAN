import { createCameraPose, interpolateCamera, type CameraKeyframe, type CameraPose } from '@/lib/camera';
import type { DeviceTier } from '@/lib/tiers';
import { useMeridianStore } from '@/store';

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
 * against 4.2). The disc overfills the frame height and bleeds off the right
 * edge, leaving the left half to the closing headline. Portrait: the body
 * crops past the top and right edges above the headline (d = 4.6 against 6.5).
 * Both are static poses; the scroll motion of Act IV is the setting sun.
 */
export const returnCameraPose: CameraPose = { at: 0, position: [0, -0.15, 2.9], target: [-0.95, 0.05, 0], fov: 35 };
export const returnCameraPosePortrait: CameraPose = { at: 0, position: [0, 0, 4.6], target: [-0.22, -0.7, 0], fov: 35 };

export function getReturnCamera(portrait = false): CameraPose {
  return portrait ? returnCameraPosePortrait : returnCameraPose;
}
