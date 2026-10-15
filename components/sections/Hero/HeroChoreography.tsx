'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motionCssVars } from '@/components/ui/motion-presets';

export function HeroChoreography({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('@/lib/deferred/HeroChoreography').then(({ attachHeroChoreography }) => {
      if (!disposed) cleanup = attachHeroChoreography(stage);
    }).catch(() => {});
    return () => { disposed = true; cleanup?.(); };
  }, []);
  return <div ref={stageRef} className="hero__stage" style={motionCssVars}>{children}</div>;
}
