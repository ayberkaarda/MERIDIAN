'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { createCameraPose, interpolateCamera } from '@/lib/camera';
import { useMeridianStore } from '@/store';
import { cameraPath, cameraPathPortrait, PORTRAIT_ASPECT_THRESHOLD } from './cameraPath';

export function CameraRig() {
  const pose = useRef(createCameraPose());
  const portrait = useThree(({ size }) => size.width / Math.max(1, size.height) < PORTRAIT_ASPECT_THRESHOLD);
  const path = portrait ? cameraPathPortrait : cameraPath;
  useFrame(({ camera }) => {
    const state = useMeridianStore.getState();
    const first = path[0];
    if (!first) return;
    const last = path[path.length - 1] ?? first;
    const progress = state.reducedMotion
      ? (state.activeAct === 'departure' && state.departureProgress < 0.5 ? first.at : last.at)
      : first.at + (last.at - first.at) * state.departureProgress;
    const next = interpolateCamera(path, progress, pose.current);
    camera.position.set(...next.position);
    camera.lookAt(...next.target);
    if (camera instanceof PerspectiveCamera && camera.fov !== next.fov) {
      camera.fov = next.fov;
      camera.updateProjectionMatrix();
    }
  }, -1);
  return null;
}
