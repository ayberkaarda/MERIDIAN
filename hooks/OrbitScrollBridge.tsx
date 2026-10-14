'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { useMeridianStore } from '@/store';

export function OrbitScrollBridge() {
  const reduced = useMeridianStore((state) => state.reducedMotion);
  useEffect(() => {
    let trigger: ScrollTrigger | undefined;
    let element: HTMLElement | null = null;
    const publish = (self: ScrollTrigger): void => {
      const state = useMeridianStore.getState();
      if (state.orbitProgress !== self.progress) state.setOrbitProgress(self.progress);
    };
    const connect = (): void => {
      const next = document.querySelector<HTMLElement>('[data-orbit-pin]');
      if (next === element) return;
      trigger?.kill();
      trigger = undefined;
      element = next;
      if (!element) {
        useMeridianStore.getState().setOrbitProgress(0);
        return;
      }
      // DOM owns pinning; this trigger only reads the same 200vh interval.
      trigger = ScrollTrigger.create({
        trigger: element,
        start: 'top top',
        end: () => reduced ? `+=${Math.max(1, element?.offsetHeight ?? 1)}` : `+=${window.innerHeight * 2}`,
        invalidateOnRefresh: true,
        onUpdate: publish,
        onRefresh: publish,
      });
      publish(trigger);
    };
    connect();
    const observer = new MutationObserver(connect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-orbit-pin'] });
    return () => {
      observer.disconnect();
      trigger?.kill();
    };
  }, [reduced]);
  return null;
}
