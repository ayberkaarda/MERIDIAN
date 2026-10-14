'use client';

import { useEffect } from 'react';
import { useMeridianStore } from '../store';

export function useReducedMotion(): boolean {
  const reduced = useMeridianStore((state) => state.reducedMotion);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => useMeridianStore.getState().setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}
