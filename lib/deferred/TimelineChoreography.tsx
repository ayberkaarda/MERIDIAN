'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motionCssVars } from '@/components/ui/motion-presets';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { durations, easings } from '@/lib/motion';
import { useMeridianStore } from '@/store';

interface TimelineChoreographyProps {
  children: ReactNode;
}

const conditions = {
  horizontal: '(min-width: 48rem) and (prefers-reduced-motion: no-preference)',
  stacked: '(max-width: 47.99rem) and (prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

/** Share of the viewport width at which an incoming panel's text is spoken. */
const PANEL_ENTER = 0.85;

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Act II, distance beat: the years pass like mile markers.
 * - Desktop: the stage holds while the track travels (scrubbed, with the
 *   progress hairline); each milestone rises in once as its panel enters
 *   (triggered, never scrubbed).
 * - Mobile: cards scroll vertically; the sticky year changes as each card
 *   crosses the reading line.
 * - Reduced motion: stacked panels, opacity-only reveals, no hold, no scrub.
 * The current panel index is written to the store for the scene.
 */
export function TimelineChoreography({ children }: TimelineChoreographyProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const section = stage?.closest('section');
    const viewport = stage?.querySelector<HTMLElement>('[data-timeline-viewport]');
    const track = stage?.querySelector<HTMLElement>('[data-timeline-track]');
    if (!stage || !section || !viewport || !track) return;
    const panels = gsap.utils.toArray<HTMLElement>('[data-timeline-panel]', stage);
    const years = gsap.utils.toArray<HTMLElement>('[data-timeline-year]', stage);
    const bodies = panels.map((panel) => panel.querySelector<HTMLElement>('[data-timeline-reveal]'));
    const counter = stage.querySelector<HTMLElement>('[data-timeline-step]');
    const progressFill = stage.querySelector<HTMLElement>('[data-timeline-progress]');
    if (panels.length === 0) return;

    let current = -1;
    const setCurrent = (next: number): void => {
      if (next === current) return;
      current = next;
      panels.forEach((panel, index) => {
        panel.dataset.current = String(index === next);
      });
      years.forEach((year, index) => {
        year.dataset.current = String(index === next);
      });
      if (counter) counter.textContent = pad(next + 1);
      useMeridianStore.getState().setTimelineIndex(next);
    };

    const mm = gsap.matchMedia();
    mm.add(conditions, (context) => {
      const horizontal = Boolean(context.conditions?.horizontal);
      const reduce = Boolean(context.conditions?.reduce);
      current = -1;
      setCurrent(0);

      const reveals = bodies.map((body) =>
        body
          ? gsap.fromTo(
              body,
              reduce ? { opacity: 0 } : { opacity: 0, yPercent: 24 },
              {
                opacity: 1,
                ...(reduce ? {} : { yPercent: 0 }),
                duration: reduce ? durations.m : durations.l,
                ease: easings.reveal,
                paused: true,
              },
            )
          : null,
      );
      const revealed = panels.map(() => false);
      const reveal = (index: number): void => {
        if (revealed[index]) return;
        revealed[index] = true;
        reveals[index]?.play();
      };

      if (!horizontal) {
        // Stacked: each card owns the reading line while it crosses it.
        const triggers = panels.flatMap((panel, index) => [
          ScrollTrigger.create({
            trigger: panel,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: (self) => {
              if (self.isActive) setCurrent(index);
            },
          }),
          ScrollTrigger.create({
            trigger: panel,
            start: 'top 85%',
            once: true,
            onEnter: () => reveal(index),
          }),
        ]);
        return () => {
          triggers.forEach((trigger) => trigger.kill());
          setCurrent(0);
        };
      }

      // Horizontal: geometry is measured only when ScrollTrigger refreshes,
      // never during scroll. Positions are expressed as track progress.
      let travel = 0;
      let centres: number[] = [];
      let enters: number[] = [];
      const measure = (): number => {
        const width = viewport.clientWidth;
        travel = Math.max(0, track.offsetWidth - width);
        const toProgress = (offset: number): number => (travel === 0 ? 0 : offset / travel);
        centres = panels.map((panel) => toProgress(panel.offsetLeft + panel.offsetWidth / 2 - width / 2));
        enters = panels.map((panel) => toProgress(panel.offsetLeft - width * PANEL_ENTER));
        return travel;
      };

      const update = (progress: number): void => {
        let nearest = 0;
        let distance = Number.POSITIVE_INFINITY;
        centres.forEach((centre, index) => {
          const gap = Math.abs(centre - progress);
          if (gap < distance) {
            distance = gap;
            nearest = index;
          }
        });
        setCurrent(nearest);
        enters.forEach((enter, index) => {
          if (progress >= enter) reveal(index);
        });
      };

      const travelTimeline = gsap.timeline({
        defaults: { ease: easings.scrub },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => {
            if (self.progress > 0) update(self.progress);
          },
        },
      });
      // Scrubbed timeline: durations are relative weights, the two tracks share one.
      travelTimeline.to(track, { x: () => -measure(), duration: durations.m }, 0);
      if (progressFill) {
        travelTimeline.fromTo(progressFill, { scaleX: 0 }, { scaleX: 1, duration: durations.m }, 0);
      }

      // The first panels are already in frame as the section arrives.
      const arrival = ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        once: true,
        onEnter: () => update(travelTimeline.scrollTrigger?.progress ?? 0),
      });

      return () => {
        arrival.kill();
        setCurrent(0);
      };
    });

    // Panel geometry depends on font metrics and layout width: re-measure once
    // the webfonts settle and whenever the track or stage changes size.
    // Refreshes are batched to one per frame and never run from scroll.
    let disposed = false;
    let frame = 0;
    const refresh = (): void => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!disposed) ScrollTrigger.refresh();
      });
    };
    void document.fonts?.ready.then(refresh);
    let initialised = false;
    const resize = new ResizeObserver(() => {
      // The first callback reports the sizes ScrollTrigger already measured.
      if (initialised) refresh();
      initialised = true;
    });
    resize.observe(track);
    resize.observe(stage);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      mm.revert();
    };
  }, []);

  return (
    <div ref={stageRef} className="timeline__stage" style={motionCssVars}>
      {children}
    </div>
  );
}
