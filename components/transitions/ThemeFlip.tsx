'use client';

import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';


const DeferredThemeFlip = dynamic(() => import('@/lib/deferred/ThemeFlip').then((module) => module.ThemeFlip), {
  ssr: false,
  loading: StaticRise,
});

function StaticRise() {
  return <>
    <div aria-hidden="true" className="theme-range theme-range--rise" data-theme-rise="" />
    <div aria-hidden="true" className="theme-veil" />
  </>;
}

export function ThemeFlip() {
  const ready = useHydrated();

  return ready ? <DeferredThemeFlip /> : <StaticRise />;
}

/** Marks the scroll range in which the sun sets and the page returns to night. */
export function ThemeSet() {
  return <div aria-hidden="true" className="theme-range theme-range--set" data-theme-set="" />;
}

export const themeRiseSelector = '[data-theme-rise]';
export const themeSetSelector = '[data-theme-set]';
