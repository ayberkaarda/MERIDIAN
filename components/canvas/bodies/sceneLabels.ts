import { Vector3, type Camera, type Object3D } from 'three';
import { publishOrbitalLabelPoints, useMeridianStore } from '@/store';

const projected = new Vector3();

/** Publish pixel-space anchors; the DOM overlay owns measurement and clamping. */
export function publishSceneLabels(anchors: readonly (Object3D | null | undefined)[], camera: Camera, width: number, height: number, opacity: number): void {
  const state = useMeridianStore.getState();
  const nextOpacity = Math.round(opacity * 100) / 100;
  let changed = state.orbitalLabelOpacity !== nextOpacity;
  state.orbitalLabelOpacity = nextOpacity;
  if (state.orbitalViewport.width !== width || state.orbitalViewport.height !== height) changed = true;
  state.orbitalViewport.width = width;
  state.orbitalViewport.height = height;
  for (let index = 0; index < state.orbitalLabelPoints.length; index += 1) {
    const point = state.orbitalLabelPoints[index];
    const anchor = anchors[index];
    if (!point) continue;
    let visible = false;
    if (anchor && nextOpacity > 0) {
      anchor.updateWorldMatrix(true, false);
      projected.setFromMatrixPosition(anchor.matrixWorld).project(camera);
      visible = projected.z > -1 && projected.z < 1 && Number.isFinite(projected.x) && Number.isFinite(projected.y);
      if (visible) {
        const x = Math.round((projected.x + 1) * 0.5 * width);
        const y = Math.round((1 - projected.y) * 0.5 * height);
        if (x !== point.x || y !== point.y) changed = true;
        point.x = x; point.y = y;
      }
    }
    if (point.visible !== visible) changed = true;
    point.visible = visible;
  }
  if (changed) publishOrbitalLabelPoints();
}
