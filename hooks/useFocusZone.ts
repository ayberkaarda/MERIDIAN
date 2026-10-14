'use client';

import { useEffect, useRef, type RefObject } from 'react';

export interface FocusZoneOptions {
  onEnter: () => void;
}

export function useFocusZone<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { onEnter }: FocusZoneOptions,
): void {
  const callback = useRef(onEnter);
  useEffect(() => { callback.current = onEnter; }, [onEnter]);
  useEffect(() => {
    const query = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 767px)');
    let observer: IntersectionObserver | undefined;
    const observe = (): void => {
      observer?.disconnect();
      if (!query.matches || !ref.current || typeof IntersectionObserver === 'undefined') return;
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) callback.current();
        }
      }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
      observer.observe(ref.current);
    };
    observe();
    query.addEventListener('change', observe);
    return () => {
      observer?.disconnect();
      query.removeEventListener('change', observe);
    };
  }, [ref]);
}
