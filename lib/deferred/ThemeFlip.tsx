'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { durations, easings } from '@/lib/motion';
import { useMeridianStore } from '@/store';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const RISE_SELECTOR = '[data-theme-rise]';
const SET_SELECTOR = '[data-theme-set]';

interface Range {
  start: number;
  end: number;
}

const clamp01 = (value: number): number => (value <= 0 ? 0 : value >= 1 ? 1 : value);
const rangeProgress = (scroll: number, range: Range | null): number => {
  if (!range) return 0;
  const length = range.end - range.start;
  return length <= 0 ? (scroll >= range.end ? 1 : 0) : clamp01((scroll - range.start) / length);
};

/**
 * Scroll interval during which an element's top sits at or above the viewport
 * top and its bottom has not yet passed the viewport bottom: the stretch in
 * which the element alone fills the screen. Measured on refresh only.
 */
const measureRange = (element: Element, scroll: number, viewport: number, snap: boolean): Range => {
  const rect = element.getBoundingClientRect();
  const top = rect.top + scroll;
  if (snap) {
    // Reduced motion: the range collapses to the moment the element is centred.
    const centred = top + rect.height / 2 - viewport / 2;
    return { start: centred, end: centred };
  }
  return { start: top, end: Math.max(top, rect.bottom + scroll - viewport) };
};

/**
 * Act III, arrival beat: the sun rises, its disc fills the viewport and the
 * page turns to day; in Act IV it sets and the page returns to night.
 *
 * One ScrollTrigger spans from the rise range to the set range. Its update
 * derives the mix purely from the scroll position, so any scroll velocity,
 * a jump or a scroll back lands on the same value, and in the same callback
 * writes `--theme-mix` on the root element (CSS interpolates the colours) and
 * `themeProgress` to the store (the scene reads it in its frame loop).
 * Reduced motion: the mix snaps to 0 or 1 at each range midpoint and a veil of
 * the outgoing surface fades out (opacity only).
 *
 * Renders the rise range itself; `ThemeSet` marks the set range.
 */
export function ThemeFlip() {
  const riseRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const riseElement = riseRef.current;
    const veil = veilRef.current;
    if (!riseElement) return;
    const root = document.documentElement;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);

    let rise: Range | null = null;
    let set: Range | null = null;
    let reduced = query.matches;
    let current = Number.NaN;
    let crossfade: gsap.core.Tween | null = null;

    const apply = (mix: number): void => {
      if (mix === current) return;
      const previous = current;
      current = mix;
      root.style.setProperty('--theme-mix', mix.toFixed(4));
      useMeridianStore.getState().setThemeProgress(mix);
      const light = mix >= 0.5;
      if (light) root.dataset.theme = 'light';
      else delete root.dataset.theme;

      // Reduced motion: crossfade only on a real flip, never on the first write.
      if (!reduced || !veil || Number.isNaN(previous)) return;
      crossfade?.kill();
      veil.dataset.from = previous >= 0.5 ? 'light' : 'dark';
      crossfade = gsap.fromTo(
        veil,
        { opacity: 1 },
        { opacity: 0, duration: durations.m, ease: easings.reveal },
      );
    };

    const compute = (scroll: number): void => {
      const mix = rangeProgress(scroll, rise) * (1 - rangeProgress(scroll, set));
      apply(reduced ? (mix >= 0.5 ? 1 : 0) : mix);
    };

    const measure = (scroll: number): void => {
      const viewport = window.innerHeight;
      rise = measureRange(riseElement, scroll, viewport, reduced);
      const setElement = document.querySelector(SET_SELECTOR);
      set = setElement ? measureRange(setElement, scroll, viewport, reduced) : null;
    };

    // Ranges are re-measured on every refresh (fonts, layout, resize) through
    // the function-based start/end, so the thresholds never go stale. The
    // trigger spans one viewport beyond both ranges so leaving it always
    // delivers a final update at the clamped value.
    const trigger = ScrollTrigger.create({
      start: () => {
        measure(window.scrollY);
        return Math.max(0, (rise?.start ?? 0) - window.innerHeight);
      },
      end: () => (set ?? rise ?? { end: 0 }).end + window.innerHeight,
      invalidateOnRefresh: true,
      onRefresh: (self) => compute(self.scroll()),
      onUpdate: (self) => compute(self.scroll()),
    });
    compute(trigger.scroll());

    const onPreferenceChange = (): void => {
      reduced = query.matches;
      crossfade?.kill();
      if (veil) gsap.set(veil, { opacity: 0 });
      ScrollTrigger.refresh();
    };
    query.addEventListener('change', onPreferenceChange);

    return () => {
      query.removeEventListener('change', onPreferenceChange);
      trigger.kill();
      crossfade?.kill();
      root.style.removeProperty('--theme-mix');
      delete root.dataset.theme;
      useMeridianStore.getState().setThemeProgress(0);
    };
  }, []);

  return (
    <>
      <div ref={riseRef} aria-hidden="true" className="theme-range theme-range--rise" data-theme-rise="" />
      <div ref={veilRef} aria-hidden="true" className="theme-veil" />
    </>
  );
}

/** Marks the scroll range in which the sun sets and the page returns to night. */
export function ThemeSet() {
  return <div aria-hidden="true" className="theme-range theme-range--set" data-theme-set="" />;
}

export { RISE_SELECTOR as themeRiseSelector, SET_SELECTOR as themeSetSelector };
