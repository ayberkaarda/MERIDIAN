export type CameraKeyframe = {
  at: number;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

export type CameraPose = Required<CameraKeyframe>;

export function createCameraPose(): CameraPose {
  return { at: 0, position: [0, 0, 8], target: [0, 0, 0], fov: 45 };
}

const AXES = [0, 1, 2] as const;

// GSAP power2.inOut is a cubic ease.
function easeCamera(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function interpolateCamera(
  keyframes: readonly CameraKeyframe[],
  progress: number,
  result: CameraPose = createCameraPose(),
  easingRange?: readonly [number, number],
): CameraPose {
  const first = keyframes[0];
  if (!first) return result;
  const last = keyframes[keyframes.length - 1] ?? first;
  const clamped = Number.isFinite(progress) ? Math.min(last.at, Math.max(first.at, progress)) : first.at;
  // Keep Act I's easing independent of keyframes appended for later acts.
  const start = easingRange?.[0] ?? first.at;
  const end = easingRange?.[1] ?? last.at;
  const duration = end - start;
  const normalized = duration > 0 ? Math.min(1, Math.max(0, (clamped - start) / duration)) : 0;
  const at = duration > 0 ? start + duration * easeCamera(normalized) : start;
  let from = first;
  let to = first;
  for (const frame of keyframes) {
    to = frame;
    if (frame.at >= at) break;
    from = frame;
  }
  const span = to.at - from.at;
  const amount = span > 0 ? Math.min(1, Math.max(0, (at - from.at) / span)) : 0;
  for (const axis of AXES) {
    result.position[axis] = from.position[axis] + (to.position[axis] - from.position[axis]) * amount;
    result.target[axis] = from.target[axis] + (to.target[axis] - from.target[axis]) * amount;
  }
  result.at = at;
  result.fov = (from.fov ?? 45) + ((to.fov ?? 45) - (from.fov ?? 45)) * amount;
  return result;
}
