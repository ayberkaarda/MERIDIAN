'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motionConditions, readConditions } from '@/components/typography/motionQueries';
import { motionCssVars } from '@/components/ui/motion-presets';
import { gsap, SplitText } from '@/lib/gsap';
import { durations, easings, motion } from '@/lib/motion';
import { onPreloaderRelease } from './preloaderGate';

interface HeroChoreographyProps {
  children: ReactNode;
}

/**
 * Act I choreography for the hero stage.
 * - departure (arrival on screen): headline lines rise once the preloader releases.
 * - departure (leaving): over the first 150vh the stage holds while each line
 *   drifts upward at its own rate and fades, as the camera pulls away.
 * Text reveals are triggered; only the departure drift is scrubbed.
 */
export function HeroChoreography({ children }: HeroChoreographyProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const section = stage?.closest('section');
    const heading = stage?.querySelector<HTMLElement>('[data-split-headline]');
    if (!stage || !section || !heading) return;
    const reveals = gsap.utils.toArray<HTMLElement>('[data-hero-reveal]', stage);
    const departs = gsap.utils.toArray<HTMLElement>('[data-hero-depart]', stage);
    const horizon = stage.querySelector<HTMLElement>('[data-hero-horizon]');

    const mm = gsap.matchMedia();
    mm.add(motionConditions, (context) => {
      const { reduce } = readConditions(context.conditions);

      if (reduce) {
        // Static composition; the hero simply surfaces as the preloader fades.
        const surfaces = [heading, ...reveals, ...(horizon ? [horizon] : [])];
        gsap.set(surfaces, { opacity: 0 });
        const intro = gsap.to(surfaces, {
          opacity: 1,
          duration: durations.m,
          ease: easings.reveal,
          stagger: motion.headlineStagger,
          paused: true,
        });
        return onPreloaderRelease((delay) => intro.delay(delay).play());
      }

      let released = false;
      let delay = 0;
      let headlineIntro: gsap.core.Tween | null = null;
      let departure: gsap.core.Timeline | null = null;

      // Secondary layer: meta, CTA and the horizon hairline follow the headline.
      const supportIntro = gsap.timeline({ paused: true, defaults: { ease: easings.reveal } });
      supportIntro.fromTo(
        reveals,
        { opacity: 0, yPercent: 40 },
        { opacity: 1, yPercent: 0, duration: durations.m, stagger: motion.headlineStagger },
        motion.headlineStagger * 3 + durations.s,
      );
      if (horizon) {
        supportIntro.fromTo(
          horizon,
          { scaleX: 0 },
          { scaleX: 1, duration: durations.l },
          motion.headlineStagger * 2,
        );
      }

      const buildDeparture = (masks: Element[]): void => {
        departure?.scrollTrigger?.kill();
        departure?.kill();
        const timeline = gsap.timeline({
          defaults: { ease: easings.scrub },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        // Supporting chrome leaves first; the headline lingers like a receding coastline.
        // Scrubbed timeline: durations are relative weights, not seconds; scale values reused.
        timeline.to(departs, { autoAlpha: 0, yPercent: -60, duration: durations.s }, 0);
        if (horizon) timeline.to(horizon, { opacity: 0, duration: durations.s }, 0);
        const count = masks.length;
        masks.forEach((mask, index) => {
          // Upper lines travel further, so the block opens out as it rises.
          const travel = 70 + (count - 1 - index) * 45;
          timeline.to(mask, { yPercent: -travel, opacity: 0, duration: durations.m }, 0.08 + index * 0.06);
        });
        departure = timeline;
      };

      const split = SplitText.create(heading, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-headline__line',
        autoSplit: true,
        onSplit: (self: SplitText) => {
          buildDeparture(self.masks);
          headlineIntro = gsap.from(self.lines, {
            yPercent: 110,
            duration: durations.l,
            ease: easings.reveal,
            stagger: motion.headlineStagger,
            delay: released ? 0 : delay,
            paused: !released,
          });
          return headlineIntro;
        },
      });

      const disposeGate = onPreloaderRelease((releaseDelay) => {
        released = true;
        delay = releaseDelay;
        headlineIntro?.delay(releaseDelay).play();
        supportIntro.delay(releaseDelay).play();
      });

      return () => {
        disposeGate();
        departure?.scrollTrigger?.kill();
        departure?.kill();
        supportIntro.kill();
        split.revert();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={stageRef} className="hero__stage" style={motionCssVars}>
      {children}
    </div>
  );
}
