'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { useMeridianStore } from '@/store';

export function CraftScrollBridge() {
  const reduced = useMeridianStore((state) => state.reducedMotion);
  useEffect(() => {
    let trigger: ScrollTrigger | undefined;
    let element: HTMLElement | null = null;
    const publish = (self: ScrollTrigger): void => {
      const state = useMeridianStore.getState();
      if (state.craftProgress !== self.progress) state.setCraftProgress(self.progress);
    };
    const connect = (): void => {
      const next = document.querySelector<HTMLElement>('[data-craft-pin]');
      if (next === element) return;
      trigger?.kill();
      trigger = undefined;
      element = next;
      if (!element) {
        useMeridianStore.getState().setCraftProgress(0);
        return;
      }
      // DOM owns the pin; read its 250vh travel without creating another pin.
      trigger = ScrollTrigger.create({
        trigger: element,
        start: 'top top',
        end: () => reduced ? `+=${Math.max(1, element?.offsetHeight ?? 1)}` : `+=${window.innerHeight * 2.5}`,
        invalidateOnRefresh: true,
        onUpdate: publish,
        onRefresh: publish,
      });
      publish(trigger);
    };
    connect();
    const observer = new MutationObserver(connect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-craft-pin'] });
    return () => {
      observer.disconnect();
      trigger?.kill();
    };
  }, [reduced]);
  return null;
}
