import type { CameraKeyframe } from '@/lib/camera';

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
