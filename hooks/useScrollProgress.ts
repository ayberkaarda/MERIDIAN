'use client';

import { useMeridianStore } from '../store';

export function useScrollProgress(): number {
  return useMeridianStore((state) => state.scrollProgress);
}
