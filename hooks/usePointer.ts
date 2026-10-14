'use client';

import { useEffect } from 'react';
import { useMeridianStore, type PointerPosition } from '../store';

export function usePointer(): PointerPosition {
  const pointer = useMeridianStore((state) => state.pointer);
  useEffect(() => {
    const query = window.matchMedia('(pointer: fine)');
    const hide = (): void => {
      const state = useMeridianStore.getState();
      state.setPointer({ ...state.pointer, visible: false });
    };
    const move = (event: PointerEvent): void => {
      if (!query.matches || event.pointerType === 'touch') { hide(); return; }
      useMeridianStore.getState().setPointer({ x: event.clientX, y: event.clientY, normalizedX: (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1, normalizedY: 1 - (event.clientY / Math.max(1, window.innerHeight)) * 2, visible: true });
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    query.addEventListener('change', hide);
    const visibility = (): void => { if (document.hidden) hide(); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      query.removeEventListener('change', hide);
      document.removeEventListener('visibilitychange', visibility);
      hide();
    };
  }, []);
  return pointer;
}
