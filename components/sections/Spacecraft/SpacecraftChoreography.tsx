'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motionConditions, readConditions } from '@/components/typography/motionQueries';
import { motionCssVars } from '@/components/ui/motion-presets';
import { copy } from '@/data/copy';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { durations, easings } from '@/lib/motion';
import { useMeridianStore, type CraftLabelPoint, type MeridianStore } from '@/store';

interface SpacecraftChoreographyProps {
  children: ReactNode;
}

/** Orbit progress at which each label (radiator, docking, bus) is spoken. */
const LABEL_CUES = [0.12, 0.42, 0.7] as const;
/** Share of the orbit over which a leader line draws out after its cue. */
const DRAW_SPAN = 0.1;

const clamp01 = (value: number): number => (value <= 0 ? 0 : value >= 1 ? 1 : value);

interface LabelGeometry {
  /** Label box in stage coordinates, measured on resize only. */
  left: number;
  right: number;
  centreY: number;
}

interface Geometry {
  stageTop: number;
  stageHeight: number;
  sectionTop: number;
  sectionBottom: number;
  viewportWidth: number;
  viewportHeight: number;
  labels: LabelGeometry[];
}

/**
 * Act III, arrival beat: the camera circles the craft and its parts are named
 * one at a time.
 * - Labels fade in once their orbit cue is passed (triggered, never scrubbed)
 *   and fade out again on scroll back.
 * - Leader lines run from each label to its projected anchor; their stroke
 *   draws out with orbit progress (scrubbed through stroke-dashoffset).
 * Everything updates from one store subscription: the scene publishes the
 * projected anchors each frame and the scroll bridge publishes the orbit
 * progress, so there is no React state and no polling. Geometry is measured
 * only on resize; the update reads `window.scrollY` and cached numbers.
 * Reduced motion: no hold and no scrub; labels and lines are simply present
 * and the composition fades in.
 */
export function SpacecraftChoreography({ children }: SpacecraftChoreographyProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    const section = stage?.closest('section');
    if (!stage || !svg || !section) return;
    const labels = gsap.utils.toArray<HTMLElement>('[data-craft-label]', stage);
    const lines = gsap.utils.toArray<SVGLineElement>('[data-craft-line]', svg);
    const dots = gsap.utils.toArray<SVGCircleElement>('[data-craft-dot]', svg);
    const leaders = gsap.utils.toArray<SVGGElement>('[data-craft-leader]', svg);
    const distance = stage.querySelector<HTMLElement>('[data-craft-distance]');
    const reveals = gsap.utils.toArray<HTMLElement>('[data-craft-reveal], .craft__header', stage);

    const geometry: Geometry = {
      stageTop: 0,
      stageHeight: 0,
      sectionTop: 0,
      sectionBottom: 0,
      viewportWidth: 1,
      viewportHeight: 1,
      labels: labels.map(() => ({ left: 0, right: 0, centreY: 0 })),
    };

    let reduced = window.matchMedia(motionConditions.reduce).matches;
    const spoken = labels.map(() => false);
    const written = leaders.map(() => ({ x1: Number.NaN, y1: Number.NaN, x2: Number.NaN, y2: Number.NaN, draw: Number.NaN, shown: false }));

    const measure = (): void => {
      const scroll = window.scrollY;
      const sectionBox = section.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      geometry.sectionTop = sectionBox.top + scroll;
      geometry.sectionBottom = sectionBox.bottom + scroll;
      geometry.stageHeight = stageBox.height;
      geometry.viewportWidth = window.innerWidth;
      geometry.viewportHeight = window.innerHeight;
      labels.forEach((label, index) => {
        const box = label.getBoundingClientRect();
        const target = geometry.labels[index];
        if (!target) return;
        target.left = box.left - stageBox.left;
        target.right = box.right - stageBox.left;
        target.centreY = box.top - stageBox.top + box.height / 2;
      });
      svg.setAttribute('viewBox', `0 0 ${Math.round(stageBox.width)} ${Math.round(stageBox.height)}`);
    };

    const speak = (index: number, on: boolean): void => {
      if (spoken[index] === on) return;
      spoken[index] = on;
      const label = labels[index];
      if (!label) return;
      gsap.to(label, {
        opacity: on ? 1 : 0,
        duration: on ? durations.m : durations.s,
        ease: easings.reveal,
        overwrite: 'auto',
      });
    };

    const update = (state: MeridianStore): void => {
      const progress = state.craftProgress;
      // Where the sticky stage sits in the viewport, from cached geometry and scroll.
      const scroll = window.scrollY;
      const natural = geometry.sectionTop - scroll;
      const stageTop = natural > 0 ? natural : Math.min(0, geometry.sectionBottom - scroll - geometry.stageHeight);
      geometry.stageTop = stageTop;
      // Lines join labels (moving with the stage) to anchors (fixed to the
      // viewport), so they are drawn only while the stage is held, or, without
      // a hold, while it is on screen.
      const onStage = reduced
        ? stageTop < geometry.viewportHeight && stageTop + geometry.stageHeight > 0
        : Math.abs(stageTop) < 1 && progress > 0 && progress < 1;

      if (!reduced) {
        LABEL_CUES.forEach((cue, index) => speak(index, progress >= cue));
        if (distance) distance.style.transform = `scaleX(${progress.toFixed(4)})`;
      }

      leaders.forEach((leader, index) => {
        const point: CraftLabelPoint | undefined = state.craftLabelPoints[index];
        const label = geometry.labels[index];
        const memo = written[index];
        const line = lines[index];
        const dot = dots[index];
        if (!memo || !line || !dot || !label) return;
        const cue = LABEL_CUES[index] ?? 0;
        const draw = reduced ? 1 : clamp01((progress - cue) / DRAW_SPAN);
        const shown = onStage && Boolean(point?.visible) && draw > 0;
        if (shown !== memo.shown) {
          memo.shown = shown;
          leader.style.opacity = shown ? '1' : '0';
        }
        if (!shown || !point) return;
        const x2 = point.x * geometry.viewportWidth;
        const y2 = point.y * geometry.viewportHeight - stageTop;
        const toRight = x2 > (label.left + label.right) / 2;
        const x1 = toRight ? label.right + 8 : label.left - 8;
        const y1 = label.centreY;
        if (x1 !== memo.x1 || y1 !== memo.y1 || x2 !== memo.x2 || y2 !== memo.y2) {
          memo.x1 = x1;
          memo.y1 = y1;
          memo.x2 = x2;
          memo.y2 = y2;
          line.setAttribute('x1', x1.toFixed(1));
          line.setAttribute('y1', y1.toFixed(1));
          line.setAttribute('x2', x2.toFixed(1));
          line.setAttribute('y2', y2.toFixed(1));
          dot.setAttribute('cx', x2.toFixed(1));
          dot.setAttribute('cy', y2.toFixed(1));
        }
        if (draw !== memo.draw) {
          memo.draw = draw;
          line.style.strokeDashoffset = (1 - draw).toFixed(4);
          dot.style.opacity = draw >= 1 ? '1' : '0';
        }
      });
    };

    const mm = gsap.matchMedia();
    mm.add(motionConditions, (context) => {
      const flags = readConditions(context.conditions);
      reduced = flags.reduce;
      spoken.fill(false);
      if (reduced) {
        gsap.set(labels, { opacity: 1 });
        gsap.fromTo(
          reveals.concat(labels),
          { opacity: 0 },
          {
            opacity: 1,
            duration: durations.m,
            ease: easings.reveal,
            scrollTrigger: { trigger: section, start: 'top 70%', once: true },
          },
        );
      } else {
        gsap.set(labels, { opacity: 0 });
        gsap.fromTo(
          reveals,
          { opacity: 0, yPercent: 40 },
          {
            opacity: 1,
            yPercent: 0,
            duration: durations.l,
            ease: easings.reveal,
            scrollTrigger: { trigger: section, start: 'top 55%', once: true },
          },
        );
      }
      written.forEach((memo) => {
        memo.draw = Number.NaN;
      });
      update(useMeridianStore.getState());
      return () => {
        gsap.killTweensOf(labels);
        gsap.set(labels, { clearProps: 'opacity' });
        distance?.style.removeProperty('transform');
      };
    });

    let frame = 0;
    const remeasure = (): void => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        measure();
        written.forEach((memo) => {
          memo.x1 = Number.NaN;
        });
        update(useMeridianStore.getState());
      });
    };
    measure();
    const resize = new ResizeObserver(remeasure);
    resize.observe(stage);
    resize.observe(section);
    void document.fonts?.ready.then(remeasure);
    // Content above may change height and move the section without resizing
    // it; every ScrollTrigger refresh re-measures the cached geometry.
    const onRefresh = (): void => {
      measure();
      written.forEach((memo) => {
        memo.x1 = Number.NaN;
      });
      update(useMeridianStore.getState());
    };
    ScrollTrigger.addEventListener('refresh', onRefresh);

    update(useMeridianStore.getState());
    // The projected points are mutated in place and announced with a fresh
    // state envelope each frame, so every notification is a potential change.
    const unsubscribe = useMeridianStore.subscribe((state) => update(state));

    return () => {
      unsubscribe();
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      mm.revert();
    };
  }, []);

  return (
    <div ref={stageRef} className="craft__stage" style={motionCssVars}>
      <svg ref={svgRef} aria-hidden="true" focusable="false" className="craft__leaders">
        {copy.spacecraft.labels.map((label) => (
          <g key={label} data-craft-leader="" className="craft__leader">
            <line data-craft-line="" pathLength={1} className="craft__line" />
            <circle data-craft-dot="" r={3} className="craft__dot" />
          </g>
        ))}
      </svg>
      {children}
    </div>
  );
}
