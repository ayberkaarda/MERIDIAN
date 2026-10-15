'use client';

import { useEffect } from 'react';
import type { ScrollTrigger } from '@/lib/gsap';
import { useMeridianStore } from '@/store';

// Camera departure shares the DOM departure's trigger and range (hero section,
// 'top top' -> 'bottom bottom'), so camera and headline always end together,
// whatever the mobile address bar does to viewport units.
export function SceneScrollBridge() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('@/lib/gsap').then(({ ScrollTrigger }) => {
      if (disposed) return;
      const section = document.querySelector<HTMLElement>('.hero__stage')?.closest('section');
      if (!section) return;
      const publish = (self: ScrollTrigger): void => {
        const state = useMeridianStore.getState();
        if (state.departureProgress !== self.progress) state.setDepartureProgress(self.progress);
      };
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        // Reduced motion: the hero is a single viewport, so travel 1.5x its own height.
        end: () => (section.offsetHeight > window.innerHeight * 1.2 ? 'bottom bottom' : `+=${section.offsetHeight * 1.5}`),
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const state = useMeridianStore.getState();
          if (state.departureProgress !== self.progress) state.setDepartureProgress(self.progress);
        },
      });
      publish(trigger);
      cleanup = () => trigger.kill();
    }).catch(() => {});
    return () => { disposed = true; cleanup?.(); };
  }, []);
  return null;
}
