'use client';

import { create } from 'zustand';
import { createLoadingSlice, createScrollSlice, createActSlice, createPointerSlice, createMotionSlice, createTierSlice, createTechnologySlice, createTimelineSlice, type MeridianStore } from './slices';

export const useMeridianStore = create<MeridianStore>()((...args) => ({
  ...createLoadingSlice(...args), ...createScrollSlice(...args), ...createActSlice(...args),
  ...createPointerSlice(...args), ...createMotionSlice(...args), ...createTierSlice(...args),
  ...createTechnologySlice(...args), ...createTimelineSlice(...args),
}));
export * from './slices';
