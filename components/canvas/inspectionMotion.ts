import { createCameraPose, type CameraPose } from '@/lib/camera';
import { durations } from '@/lib/motion';

export const inspectionDuration: number = durations.m;
export function inspectionEase(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
export function copyPose(to: CameraPose, from: CameraPose): void {
  for (let axis = 0; axis < 3; axis += 1) {
    to.position[axis] = from.position[axis] ?? 0;
    to.target[axis] = from.target[axis] ?? 0;
  }
  to.fov = from.fov;
}
export function createInspectionCamera() {
  return { current: createCameraPose(), from: createCameraPose(), key: 0, phase: '', elapsed: inspectionDuration };
}
