import type { CameraKeyframe } from '@/lib/camera';

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
 */
export const cameraPath: CameraKeyframe[] = [
  { at: 0, position: [0, 0.1, 4.2], target: [-1.1, 0.2, 0], fov: 35 },
  { at: 0.5, position: [0, 0.6, 16], target: [-4.0, -0.9, 0], fov: 35 },
  { at: 1, position: [0, 12, 480], target: [-126, -42, 0], fov: 30 },
];

/*
 * Portrait variant (aspect ~0.46): on a phone the landscape offsets would push
 * the body out of frame, so it sits high and crops past the right edge instead,
 * leaving the lower half of the screen to the headline.
 */
export const cameraPathPortrait: CameraKeyframe[] = [
  { at: 0, position: [0, 0, 6.5], target: [-0.3, -0.72, 0], fov: 35 },
  { at: 0.5, position: [0, 0.4, 18], target: [-0.65, -2.15, 0], fov: 35 },
  { at: 1, position: [0, 8, 480], target: [-17.7, -62.7, 0], fov: 30 },
];

/** Aspect below which the portrait path should be used. */
export const PORTRAIT_ASPECT_THRESHOLD = 0.9;
