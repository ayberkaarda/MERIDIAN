'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { createCameraPose, interpolateCamera } from '@/lib/camera';
import { publishCraftLabelPoints, useMeridianStore } from '@/store';
import {
  cameraPath,
  cameraPathPortrait,
  getCraftCamera,
  getCraftInspectionCamera,
  getOrbitInspectionCamera,
  getReturnCamera,
  getScenePhase,
  PORTRAIT_ASPECT_THRESHOLD,
} from './cameraPath';
import { craftAnchors } from './craftAnchors';
import { copyPose, createInspectionCamera, inspectionDuration, inspectionEase } from './inspectionMotion';
import { setAnimating } from './frameDemand';

const reducedRange: [number, number] = [0, 0];
/** Half-width of the band around each anchor's facing threshold. */
const FACING_HYSTERESIS = 0.04;

export function CameraRig() {
  const inspectionRef = useRef(createInspectionCamera());
  useEffect(() => () => setAnimating('inspection-camera', false), []);
  const pose = useRef(createCameraPose());
  const projected = useMemo(() => new Vector3(), []);
  const portrait = useThree(({ size }) => size.width / Math.max(1, size.height) < PORTRAIT_ASPECT_THRESHOLD);
  const craftOptions = useMemo(() => ({ portrait }), [portrait]);
  const path = useMemo(() => (portrait ? cameraPathPortrait : cameraPath).filter((frame) => frame.at <= 2), [portrait]);
  const first = path[0];
  const last = path[path.length - 1] ?? first;
  // Act I keeps its original 0..1 coordinates. Appended frames are Act II.
  const departureEnd = Math.min(1, last?.at ?? 1);
  const departureRange = useMemo(() => [first?.at ?? 0, departureEnd] as const, [first, departureEnd]);
  const orbitalRange = useMemo(() => [departureEnd, last?.at ?? departureEnd] as const, [departureEnd, last]);
  const transitPose = path.find((frame) => frame.at > departureEnd)?.at ?? last?.at ?? 1;
  useFrame(({ camera }, delta) => {
    const inspection = inspectionRef.current;
    const state = useMeridianStore.getState();
    if (!first || !last) return;
    const phase = getScenePhase(state);
    let next;
    if (phase === 'return') {
      // The camera settles in while the sun sinks; it holds once the sun is down.
      next = getReturnCamera(portrait, state.reducedMotion ? 1 : 1 - state.themeProgress);
    } else if (phase === 'craft') {
      next = getCraftCamera(state.reducedMotion ? 0 : state.craftProgress, craftOptions);
    } else {
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
      next = interpolateCamera(path, progress, pose.current, range);
    }
    const orbitSelected = phase === 'path' && state.activeAct === 'transit' ? state.selectedOrbit : null;
    const craftSelected = phase === 'craft' && state.activeAct === 'arrival' && state.themeProgress === 0 ? state.selectedCraftPart : null;
    const key = orbitSelected !== null ? orbitSelected + 1 + (portrait ? 10 : 0) : craftSelected ? (craftSelected === 'radiator' ? 4 : craftSelected === 'docking' ? 5 : 6) + (portrait ? 10 : 0) : 0;
    const target = orbitSelected !== null ? getOrbitInspectionCamera(portrait) : craftSelected ? getCraftInspectionCamera(craftSelected, portrait) : next;
    if (inspection.phase !== phase) {
      inspection.phase = phase;
      inspection.key = 0;
      inspection.elapsed = inspectionDuration;
      copyPose(inspection.current, next);
    }
    if (key !== inspection.key) {
      copyPose(inspection.from, inspection.current);
      inspection.key = key;
      inspection.elapsed = 0;
    }
    inspection.elapsed = state.reducedMotion ? inspectionDuration : Math.min(inspectionDuration, inspection.elapsed + Math.min(delta, 0.1));
    const amount = inspectionEase(inspection.elapsed / inspectionDuration);
    if (amount < 1) {
      for (let axis = 0; axis < 3; axis += 1) {
        const fromPosition = inspection.from.position[axis] ?? 0;
        const fromTarget = inspection.from.target[axis] ?? 0;
        inspection.current.position[axis] = fromPosition + ((target.position[axis] ?? 0) - fromPosition) * amount;
        inspection.current.target[axis] = fromTarget + ((target.target[axis] ?? 0) - fromTarget) * amount;
      }
      inspection.current.fov = inspection.from.fov + (target.fov - inspection.from.fov) * amount;
      if (phase === 'craft') {
        // Inspection moves around the look target, never through the spacecraft.
        const fromX = inspection.from.position[0] - inspection.from.target[0];
        const fromY = inspection.from.position[1] - inspection.from.target[1];
        const fromZ = inspection.from.position[2] - inspection.from.target[2];
        const toX = target.position[0] - target.target[0];
        const toY = target.position[1] - target.target[1];
        const toZ = target.position[2] - target.target[2];
        const fromRadius = Math.hypot(fromX, fromY, fromZ) || 1;
        const toRadius = Math.hypot(toX, toY, toZ) || 1;
        const fromYaw = Math.atan2(fromX, fromZ);
        const yawDifference = Math.atan2(Math.sin(Math.atan2(toX, toZ) - fromYaw), Math.cos(Math.atan2(toX, toZ) - fromYaw));
        const yaw = fromYaw + yawDifference * amount;
        const fromElevation = Math.asin(Math.min(1, Math.max(-1, fromY / fromRadius)));
        const toElevation = Math.asin(Math.min(1, Math.max(-1, toY / toRadius)));
        const elevation = fromElevation + (toElevation - fromElevation) * amount;
        const radius = fromRadius + (toRadius - fromRadius) * amount;
        const horizontal = Math.cos(elevation) * radius;
        inspection.current.position[0] = inspection.current.target[0] + Math.sin(yaw) * horizontal;
        inspection.current.position[1] = inspection.current.target[1] + Math.sin(elevation) * radius;
        inspection.current.position[2] = inspection.current.target[2] + Math.cos(yaw) * horizontal;
      }
    } else copyPose(inspection.current, target);
    setAnimating('inspection-camera', amount < 1);
    next = inspection.current;
    camera.position.set(...next.position);
    camera.lookAt(...next.target);
    const fov = next.fov ?? 45;
    if (camera instanceof PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // Craft label points only move while the camera is on the craft. Elsewhere
    // they are hidden once and the store is left alone, so no subscriber runs
    // on every frame for nothing.
    const onCraft = phase === 'craft' && state.activeAct === 'arrival' && state.themeProgress === 0;
    let changed = false;
    for (let index = 0; index < craftAnchors.length; index += 1) {
      const anchor = craftAnchors[index];
      if (!anchor) continue;
      const pointIndex = anchor.id === 'radiator' ? 0 : anchor.id === 'docking' ? 1 : 2;
      const point = state.craftLabelPoints[pointIndex];
      if (!point) continue;
      if (!onCraft) {
        if (point.visible) {
          point.visible = false;
          changed = true;
        }
        continue;
      }
      projected.set(anchor.position[0], anchor.position[1], anchor.position[2]).project(camera);
      const x = (projected.x + 1) * 0.5;
      const y = (1 - projected.y) * 0.5;
      const wasVisible = point.visible;
      if (x !== point.x || y !== point.y) changed = true;
      point.x = x;
      point.y = y;
      // Hide anchors on surfaces turned away from the camera, with a small
      // hysteresis band so a point near the threshold does not flicker.
      const dx = camera.position.x - anchor.position[0];
      const dy = camera.position.y - anchor.position[1];
      const dz = camera.position.z - anchor.position[2];
      const facing = (dx * anchor.normal[0] + dy * anchor.normal[1] + dz * anchor.normal[2]) / (Math.hypot(dx, dy, dz) || 1);
      const facingCamera = facing > anchor.minFacing + (point.visible ? -FACING_HYSTERESIS : FACING_HYSTERESIS);
      point.visible = facingCamera
        && Number.isFinite(projected.x) && Number.isFinite(projected.y)
        && projected.z >= -1 && projected.z <= 1
        && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
      if (point.visible !== wasVisible) changed = true;
    }
    if (changed) publishCraftLabelPoints();
  }, -1);
  return null;
}
