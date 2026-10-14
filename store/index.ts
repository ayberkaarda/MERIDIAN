'use client';

import { create } from 'zustand';
import { createArrivalSlice } from './slices';
import { createLoadingSlice, createScrollSlice, createActSlice, createPointerSlice, createMotionSlice, createTierSlice, createTechnologySlice, createTimelineSlice, type MeridianStore } from './slices';

export const useMeridianStore = create<MeridianStore>()((...args) => ({
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
export * from './slices';
