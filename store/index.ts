'use client';

import { create } from 'zustand';
import { createLoadingSlice, createScrollSlice, createActSlice, createPointerSlice, createMotionSlice, createTierSlice, type MeridianStore } from './slices';

export const useMeridianStore = create<MeridianStore>()((...args) => ({
  ...createLoadingSlice(...args), ...createScrollSlice(...args), ...createActSlice(...args),
  ...createPointerSlice(...args), ...createMotionSlice(...args), ...createTierSlice(...args),
}));
export * from './slices';
