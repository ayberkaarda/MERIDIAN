'use client';

import { useMeridianStore } from '../store';

// The root scroll controller writes progress through one ScrollTrigger.
export function useScrollProgress(): number {
  return useMeridianStore((state) => state.scrollProgress);
}
