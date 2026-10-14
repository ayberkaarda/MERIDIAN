'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { createCameraPose, interpolateCamera } from '@/lib/camera';
import { useMeridianStore } from '@/store';
import { cameraPath, cameraPathPortrait, PORTRAIT_ASPECT_THRESHOLD } from './cameraPath';

const reducedRange: [number, number] = [0, 0];

export function CameraRig() {
  const pose = useRef(createCameraPose());
  const portrait = useThree(({ size }) => size.width / Math.max(1, size.height) < PORTRAIT_ASPECT_THRESHOLD);
  const path = portrait ? cameraPathPortrait : cameraPath;
  const first = path[0];
  const last = path[path.length - 1] ?? first;
  // Act I keeps its original 0..1 coordinates. Appended frames are Act II.
  const departureEnd = Math.min(1, last?.at ?? 1);
  const departureRange = [first?.at ?? 0, departureEnd] as const;
  const orbitalRange = [departureEnd, last?.at ?? departureEnd] as const;
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
      const transitPose = path.find((frame) => frame.at > departureEnd)?.at ?? last.at;
      progress = state.activeAct === 'departure' ? first.at
        : state.activeAct === 'transit' ? transitPose : last.at;
      reducedRange[0] = progress;
      reducedRange[1] = progress;
      range = reducedRange;
    }
    const next = interpolateCamera(path, progress, pose.current, range);
    camera.position.set(...next.position);
    camera.lookAt(...next.target);
    if (camera instanceof PerspectiveCamera && camera.fov !== next.fov) {
      camera.fov = next.fov;
      camera.updateProjectionMatrix();
    }
  }, -1);
  return null;
}
