'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { gsap } from '../lib/gsap';
import { durations, magneticReturnEase } from '../lib/motion';
import { useReducedMotion } from './useReducedMotion';

export interface MagneticOptions { radius?: number; strength?: number }
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>({ radius = 80, strength = 0.35 }: MagneticOptions = {}): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !ref.current || !window.matchMedia('(pointer: fine)').matches) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('@/lib/gsap').then(({ gsap }) => {
      if (disposed) return;
      const element = ref.current;
      if (!element || reduced) return;
      const query = window.matchMedia('(pointer: fine)');
      const originalTransform = element.style.transform;
      let tween: gsap.core.Tween | undefined;
      let engaged = false;
      let offsetX = 0;
      let offsetY = 0;
      const reset = (): void => {
        if (!engaged) return;
        engaged = false;
        tween?.kill();
        tween = gsap.to(element, { x: 0, y: 0, duration: durations.s, ease: magneticReturnEase, overwrite: 'auto', onUpdate: () => { offsetX = Number(gsap.getProperty(element, 'x')); offsetY = Number(gsap.getProperty(element, 'y')); } });
      };
      const move = (event: PointerEvent): void => {
        if (!query.matches || event.pointerType === 'touch') { reset(); return; }
        const rect = element.getBoundingClientRect();
        const x = event.clientX - (rect.left + rect.width / 2 - offsetX);
        const y = event.clientY - (rect.top + rect.height / 2 - offsetY);
        if (Math.hypot(x, y) > radius) { reset(); return; }
        engaged = true;
        tween?.kill();
        offsetX = x * strength;
        offsetY = y * strength;
        gsap.set(element, { x: offsetX, y: offsetY, force3D: true });
      };
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('blur', reset);
      document.documentElement.addEventListener('pointerleave', reset);
      element.addEventListener('focus', reset);
      query.addEventListener('change', reset);
      cleanup = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('blur', reset);
        document.documentElement.removeEventListener('pointerleave', reset);
        element.removeEventListener('focus', reset);
        query.removeEventListener('change', reset);
        tween?.kill();
        gsap.set(element, { clearProps: 'transform' });
        element.style.transform = originalTransform;
      };
    }).catch(() => {});
    return () => { disposed = true; cleanup?.(); };
  }, [radius, strength, reduced]);
  return ref;
}
