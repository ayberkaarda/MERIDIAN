'use client';

import { create } from 'zustand';
import { createArrivalSlice } from './slices';
import { createLoadingSlice, createScrollSlice, createActSlice, createPointerSlice, createMotionSlice, createTierSlice, createTechnologySlice, createTimelineSlice, type MeridianStore } from './slices';

export const useMeridianStore = create<MeridianStore>()((...args) => ({
  selectedOrbit: null,
  selectedCraftPart: null,
  selectOrbit: (index) => args[0]({ selectedOrbit: index !== null && Number.isInteger(index) && index >= 0 && index < 3 ? index : null }),
  selectCraftPart: (part) => args[0]({ selectedCraftPart: part }),
  returnPhaseActive: false,
  orbitalLabelPoints: Array.from({ length: 3 }, () => ({ x: 0, y: 0, visible: false })),
  orbitalLabelOpacity: 0,
  orbitalViewport: { width: 0, height: 0 },
  ...createLoadingSlice(...args), ...createScrollSlice(...args), ...createActSlice(...args),
  ...createPointerSlice(...args), ...createMotionSlice(...args), ...createTierSlice(...args),
  ...createTechnologySlice(...args), ...createTimelineSlice(...args),
  ...createArrivalSlice(...args),
}));

// Reuse notification envelopes so projected points can publish without frame allocations.
const projectionSnapshots: [MeridianStore, MeridianStore] = [{ ...useMeridianStore.getState() }, { ...useMeridianStore.getState() }];
let projectionSnapshotIndex: 0 | 1 = 0;
export function publishCraftLabelPoints(): void {
  const snapshot = projectionSnapshots[projectionSnapshotIndex];
  projectionSnapshotIndex = projectionSnapshotIndex === 0 ? 1 : 0;
  Object.assign(snapshot, useMeridianStore.getState());
  useMeridianStore.setState(snapshot, true);
}
export const publishOrbitalLabelPoints = publishCraftLabelPoints;
export * from './slices';
