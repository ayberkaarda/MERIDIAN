'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motionConditions, readConditions } from '@/components/typography/motionQueries';
import { motionCssVars } from '@/components/ui/motion-presets';
import { gsap } from '@/lib/gsap';
import { durations, easings, motion } from '@/lib/motion';

interface OrbitalChoreographyProps {
  children: ReactNode;
}

/**
 * Act II, arrival at the core.
 * - arrival: heading and orbit legend surface once as the core comes into view (triggered).
 * - distance: a hairline under the stage measures the approach while the
 *   section is held; it shares the pinned range with the camera (scrubbed).
 * Reduced motion: no hold, no scrub; the composition fades in.
 */
export function OrbitalChoreography({ children }: OrbitalChoreographyProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const section = stage?.closest('section');
    if (!stage || !section) return;
    const reveals = gsap.utils.toArray<HTMLElement>('[data-orbital-reveal]', stage);
    const distance = stage.querySelector<HTMLElement>('[data-orbital-distance]');

    const mm = gsap.matchMedia();
    mm.add(motionConditions, (context) => {
      const { reduce } = readConditions(context.conditions);

      if (reduce) {
        gsap.fromTo(
          reveals,
          { opacity: 0 },
          {
            opacity: 1,
            duration: durations.m,
            ease: easings.reveal,
            stagger: motion.headlineStagger,
            scrollTrigger: { trigger: section, start: 'top 70%', once: true },
          },
        );
        return;
      }

      gsap.fromTo(
        reveals,
        { opacity: 0, yPercent: 60 },
        {
          opacity: 1,
          yPercent: 0,
          duration: durations.l,
          ease: easings.reveal,
          stagger: motion.headlineStagger,
          scrollTrigger: { trigger: section, start: 'top 55%', once: true },
        },
      );

      if (distance) {
        gsap.fromTo(
          distance,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: easings.scrub,
            scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
          },
        );
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={stageRef} className="orbital__stage" style={motionCssVars}>
      {children}
    </div>
  );
}
