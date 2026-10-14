'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { EditorialLineState } from '@/components/typography/EditorialStatement';
import { motionConditions, readConditions } from '@/components/typography/motionQueries';
import { motionCssVars } from '@/components/ui/motion-presets';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { durations, easings } from '@/lib/motion';

interface ManifestoChoreographyProps {
  children: ReactNode;
}

/** Share of a viewport scrolled between one manifesto line and the next. */
const STEP_VIEWPORTS = 0.7;

const formatStep = (step: number): string => String(step).padStart(2, '0');

/**
 * Act I, distance beat. The stage holds while the statement is spoken one line
 * at a time; each new line rises in (triggered, never scrubbed) and the line
 * before it recedes to --muted, the way the planet recedes behind the camera.
 */
export function ManifestoChoreography({ children }: ManifestoChoreographyProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const section = stage?.closest('section');
    if (!stage || !section) return;
    const lines = gsap.utils.toArray<HTMLElement>('[data-editorial-line]', stage);
    const counter = stage.querySelector<HTMLElement>('[data-manifesto-step]');
    if (lines.length === 0) return;

    const mm = gsap.matchMedia();
    mm.add(motionConditions, (context) => {
      const { reduce } = readConditions(context.conditions);
      const statement = stage.querySelector<HTMLElement>('.editorial-statement');

      if (reduce) {
        // Resolved composition, surfacing with opacity only.
        if (!statement) return;
        gsap.fromTo(
          statement,
          { opacity: 0 },
          {
            opacity: 1,
            duration: durations.m,
            ease: easings.reveal,
            scrollTrigger: { trigger: section, start: 'top 75%', once: true },
          },
        );
        return;
      }

      const initialStates = lines.map((line) => line.dataset.state ?? 'active');
      const reveals = lines.map((line) => {
        const text = line.querySelector<HTMLElement>('.editorial-statement__text') ?? line;
        return gsap.fromTo(
          text,
          { yPercent: 105, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: durations.l, ease: easings.reveal, paused: true },
        );
      });

      let active = -1;
      const apply = (next: number): void => {
        if (next === active) return;
        active = next;
        lines.forEach((line, index) => {
          const state: EditorialLineState = index < next ? 'past' : index === next ? 'active' : 'pending';
          line.dataset.state = state;
          const reveal = reveals[index];
          if (!reveal) return;
          if (index <= next) reveal.play();
          else reveal.reverse();
        });
        if (counter) counter.textContent = formatStep(Math.max(1, next + 1));
      };
      apply(-1);

      const step = (): number => window.innerHeight * STEP_VIEWPORTS;
      const triggers = lines.map((_, index) =>
        ScrollTrigger.create({
          trigger: section,
          // The first line speaks as the section enters; the rest while it is held.
          start: () => (index === 0 ? 'top 55%' : `top+=${Math.round(index * step())} top`),
          onEnter: () => apply(index),
          onLeaveBack: () => apply(index - 1),
          invalidateOnRefresh: true,
        }),
      );

      return () => {
        triggers.forEach((trigger) => trigger.kill());
        lines.forEach((line, index) => {
          line.dataset.state = initialStates[index] ?? 'active';
        });
        if (counter) counter.textContent = formatStep(lines.length);
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={stageRef} className="manifesto__stage" style={motionCssVars}>
      {children}
    </div>
  );
}
