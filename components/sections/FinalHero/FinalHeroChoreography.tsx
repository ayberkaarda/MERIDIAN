'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motionConditions, readConditions } from '@/components/typography/motionQueries';
import { motionCssVars } from '@/components/ui/motion-presets';
import { durations, easings, motion } from '@/lib/motion';

type GsapModule = typeof import('@/lib/gsap');

interface FinalHeroChoreographyProps {
  children: ReactNode;
}

function choreograph(stage: HTMLElement, { gsap, ScrollTrigger }: GsapModule): gsap.MatchMedia {
  const glyphs = gsap.utils.toArray<HTMLElement>('[data-final-glyphs]', stage);
  const reveals = gsap.utils.toArray<HTMLElement>('[data-final-reveal]', stage);
  const mm = gsap.matchMedia();
  mm.add(motionConditions, (context) => {
    const { reduce } = readConditions(context.conditions);
    const timeline = gsap.timeline({ paused: true, defaults: { ease: easings.reveal } });
    if (reduce) {
      timeline.fromTo(glyphs, { opacity: 0 }, { opacity: 1, duration: durations.m, stagger: motion.headlineStagger }, 0);
      timeline.fromTo(reveals, { opacity: 0 }, { opacity: 1, duration: durations.m, stagger: motion.headlineStagger }, durations.s);
    } else {
      timeline.fromTo(glyphs, { yPercent: 110 }, { yPercent: 0, duration: durations.l, stagger: motion.headlineStagger }, 0);
      timeline.fromTo(
        reveals,
        { opacity: 0, yPercent: 40 },
        { opacity: 1, yPercent: 0, duration: durations.m, stagger: motion.headlineStagger },
        durations.s,
      );
    }
    const trigger = ScrollTrigger.create({
      trigger: stage,
      start: 'top 72%',
      once: true,
      onEnter: () => timeline.play(),
    });
    return () => {
      trigger.kill();
      timeline.kill();
    };
  });
  return mm;
}

/**
 * Act IV, return beat: once the stage reaches the reading line the headline
 * lines rise out of their masks, then the supporting line and CTA surface.
 * Triggered once, never scrubbed. Reduced motion: the same order, opacity only.
 * The motion library loads off the critical path; the section sits far below
 * the fold, so it is always ready before the stage is reached.
 */
export function FinalHeroChoreography({ children }: FinalHeroChoreographyProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let mm: gsap.MatchMedia | null = null;
    let disposed = false;
    void import('@/lib/gsap').then((module) => {
      if (!disposed) mm = choreograph(stage, module);
    });
    return () => {
      disposed = true;
      mm?.revert();
    };
  }, []);

  return (
    <div ref={stageRef} className="final-hero__stage" style={motionCssVars}>
      {children}
    </div>
  );
}
