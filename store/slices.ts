import type { StateCreator } from 'zustand';
import type { DeviceTier } from '../lib/tiers';
import type { ActId } from '../data/copy';

export interface LoadingSlice { loadingProgress: number; setLoadingProgress: (progress: number) => void }
export interface ScrollSlice { scrollProgress: number; setScrollProgress: (progress: number) => void }
export interface ActSlice { activeAct: ActId; setActiveAct: (act: ActId) => void }
export interface PointerPosition { x: number; y: number; normalizedX: number; normalizedY: number; visible: boolean }
export interface PointerSlice { pointer: PointerPosition; setPointer: (pointer: PointerPosition) => void }
export interface MotionSlice { reducedMotion: boolean; setReducedMotion: (reduced: boolean) => void }
export interface TierSlice { tier: DeviceTier; setTier: (tier: DeviceTier) => void }
export type MeridianStore = LoadingSlice & ScrollSlice & ActSlice & PointerSlice & MotionSlice & TierSlice;
type Slice<T> = StateCreator<MeridianStore, [], [], T>;
const clamp = (value: number, max: number): number => Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
export const createLoadingSlice: Slice<LoadingSlice> = (set) => ({ loadingProgress: 0, setLoadingProgress: (progress) => set({ loadingProgress: clamp(progress, 100) }) });
export const createScrollSlice: Slice<ScrollSlice> = (set) => ({ scrollProgress: 0, setScrollProgress: (progress) => set({ scrollProgress: clamp(progress, 1) }) });
export const createActSlice: Slice<ActSlice> = (set) => ({ activeAct: 'departure', setActiveAct: (activeAct) => set({ activeAct }) });
export const createPointerSlice: Slice<PointerSlice> = (set) => ({ pointer: { x: 0, y: 0, normalizedX: 0, normalizedY: 0, visible: false }, setPointer: (pointer) => set({ pointer }) });
export const createMotionSlice: Slice<MotionSlice> = (set) => ({ reducedMotion: true, setReducedMotion: (reducedMotion) => set({ reducedMotion }) });
export const createTierSlice: Slice<TierSlice> = (set) => ({ tier: 'low', setTier: (tier) => set({ tier }) });
