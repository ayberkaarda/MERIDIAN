'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { createCameraPose, interpolateCamera } from '@/lib/camera';
import { publishCraftLabelPoints, useMeridianStore } from '@/store';
import { cameraPath, cameraPathPortrait, getCraftCamera, getReturnCamera, PORTRAIT_ASPECT_THRESHOLD } from './cameraPath';
import { craftAnchors } from './craftAnchors';

const reducedRange: [number, number] = [0, 0];
/** Half-width of the band around each anchor's facing threshold. */
const FACING_HYSTERESIS = 0.04;

export function CameraRig() {
  const pose = useRef(createCameraPose());
  const projected = useMemo(() => new Vector3(), []);
  const portrait = useThree(({ size }) => size.width / Math.max(1, size.height) < PORTRAIT_ASPECT_THRESHOLD);
  const craftOptions = useMemo(() => ({ portrait }), [portrait]);
  const path = (portrait ? cameraPathPortrait : cameraPath).filter((frame) => frame.at <= 2);
  const first = path[0];
  const last = path[path.length - 1] ?? first;
  // Act I keeps its original 0..1 coordinates. Appended frames are Act II.
  const departureEnd = Math.min(1, last?.at ?? 1);
  const departureRange = [first?.at ?? 0, departureEnd] as const;
  const orbitalRange = [departureEnd, last?.at ?? departureEnd] as const;
  const transitPose = path.find((frame) => frame.at > departureEnd)?.at ?? last?.at ?? 1;
  useFrame(({ camera }) => {
    const state = useMeridianStore.getState();
    if (!first || !last) return;
    const inDeparture = state.departureProgress < 1 && state.orbitProgress === 0;
    let progress = inDeparture
      ? first.at + (departureEnd - first.at) * state.departureProgress
      : departureEnd + (last.at - departureEnd) * state.orbitProgress;
    let range: readonly [number, number] = inDeparture ? departureRange : orbitalRange;
    if (state.reducedMotion) {
      // Each act has one pose; scrolling within an act never moves the camera.
      progress = state.activeAct === 'departure' ? first.at
        : state.activeAct === 'transit' ? transitPose : last.at;
      reducedRange[0] = progress;
      reducedRange[1] = progress;
      range = reducedRange;
    }
    const inArrival = state.activeAct === 'arrival' || state.craftProgress > 0;
    const craftProgress = state.reducedMotion ? 0 : state.craftProgress;
    const next = state.activeAct === 'return'
      ? getReturnCamera(portrait)
      : inArrival
      ? getCraftCamera(craftProgress, craftOptions)
      : interpolateCamera(path, progress, pose.current, range);
    camera.position.set(...next.position);
    camera.lookAt(...next.target);
    const fov = next.fov ?? 45;
    if (camera instanceof PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    for (let index = 0; index < craftAnchors.length; index += 1) {
      const anchor = craftAnchors[index];
      if (!anchor) continue;
      const pointIndex = anchor.id === 'radiator' ? 0 : anchor.id === 'docking' ? 1 : 2;
      const point = state.craftLabelPoints[pointIndex];
      if (!point) continue;
      projected.set(anchor.position[0], anchor.position[1], anchor.position[2]).project(camera);
      point.x = (projected.x + 1) * 0.5;
      point.y = (1 - projected.y) * 0.5;
      // Hide anchors on surfaces turned away from the camera, with a small
      // hysteresis band so a point near the threshold does not flicker.
      const dx = camera.position.x - anchor.position[0];
      const dy = camera.position.y - anchor.position[1];
      const dz = camera.position.z - anchor.position[2];
      const facing = (dx * anchor.normal[0] + dy * anchor.normal[1] + dz * anchor.normal[2]) / (Math.hypot(dx, dy, dz) || 1);
      const facingCamera = facing > anchor.minFacing + (point.visible ? -FACING_HYSTERESIS : FACING_HYSTERESIS);
      point.visible = facingCamera && state.activeAct === 'arrival' && state.themeProgress === 0
        && Number.isFinite(projected.x) && Number.isFinite(projected.y)
        && projected.z >= -1 && projected.z <= 1
        && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
    }
    publishCraftLabelPoints();
  }, -1);
  return null;
}
