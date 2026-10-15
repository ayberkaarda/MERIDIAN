'use client';

import { useEffect } from 'react';
import { useMeridianStore } from '@/store';

/** The DOM owns scroll thresholds; the scene reads only the published phase. */
export function ReturnPhaseBridge() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('@/lib/gsap').then(({ ScrollTrigger }) => {
      if (disposed) return;
      let trigger: ReturnType<typeof ScrollTrigger.create> | null = null;
      const sync = (self: ReturnType<typeof ScrollTrigger.create>): void => {
        const active = self.scroll() >= self.start;
        if (useMeridianStore.getState().returnPhaseActive !== active) useMeridianStore.setState({ returnPhaseActive: active });
      };
      const attach = (): void => {
        if (trigger) return;
        const element = document.querySelector('[data-theme-set]');
        if (!element) return;
        trigger = ScrollTrigger.create({
          trigger: element,
          start: () => useMeridianStore.getState().reducedMotion ? 'center center' : 'top top',
          end: 'max',
          invalidateOnRefresh: true,
          onRefresh: sync,
          onUpdate: sync,
        });
        sync(trigger);
        ScrollTrigger.removeEventListener('refresh', attach);
      };
      attach();
      if (!trigger) ScrollTrigger.addEventListener('refresh', attach);
      cleanup = () => {
        ScrollTrigger.removeEventListener('refresh', attach);
        trigger?.kill();
        useMeridianStore.setState({ returnPhaseActive: false });
      };
    }).catch(() => {
      // The active-act fallback keeps the return composition readable without motion.
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);
  return null;
}
