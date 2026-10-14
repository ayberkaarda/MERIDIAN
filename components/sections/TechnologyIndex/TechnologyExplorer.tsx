'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { usePanelFallback } from '@/components/sections/panelFallback';
import { motionCssVars } from '@/components/ui/motion-presets';
import { technologies, type Technology } from '@/data/technologies';
import { useFocusZone } from '@/hooks/useFocusZone';
import { useTechPanelRegistration } from '@/hooks/useTechPanelRegistration';
import { gsap } from '@/lib/gsap';
import { durations, easings } from '@/lib/motion';
import { useMeridianStore } from '@/store';

const FINE_POINTER_QUERY = '(pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
/** Layout in which the panel is held above the entries (styles/technology.css). */
const HELD_PANEL_QUERY = '(max-width: 47.99rem)';

const total = String(technologies.length).padStart(2, '0');

const matches = (query: string): boolean => window.matchMedia(query).matches;

interface TechnologyExplorerProps {
  heading: string;
  headingId: string;
}

interface SwapController {
  request: (index: number) => void;
}

/**
 * Act II, distance beat: inspecting the systems that make the distance possible.
 * Selecting an entry (pointer hover on fine pointers, keyboard focus, click or
 * tap, or scrolling it into the focus zone on mobile) swaps the right panel.
 * The swap is a clip-path wipe of one `m`: a shutter sweeps closed over the
 * panel in one `s`, the visual changes behind it, and it sweeps open in the
 * next `s`. Reduced motion: the shutter crossfades instead.
 */
export function TechnologyExplorer({ heading, headingId }: TechnologyExplorerProps) {
  const [selected, setSelected] = useState(0);
  const [shown, setShown] = useState(0);
  const fallback = usePanelFallback();
  const registerPanel = useTechPanelRegistration();
  const shutterRef = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<SwapController | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  // Mobile: entries sliding up under the held panel are marked so they fade
  // out instead of showing through the transparent visual. The panel edge is
  // measured only when the panel resizes or the layout query flips.
  useEffect(() => {
    const stage = stageRef.current;
    const visual = visualRef.current;
    if (!stage || !visual || typeof IntersectionObserver === 'undefined') return;
    const items = Array.from(stage.querySelectorAll<HTMLElement>('.tech__item'));
    const query = window.matchMedia(HELD_PANEL_QUERY);
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const connect = (): void => {
      observer?.disconnect();
      observer = undefined;
      items.forEach((item) => item.removeAttribute('data-under'));
      if (!query.matches) return;
      const edge = Math.round((Number.parseFloat(getComputedStyle(visual).top) || 0) + visual.offsetHeight);
      const next = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const top = entry.rootBounds?.top ?? 0;
            const under = entry.intersectionRatio < 1 && entry.boundingClientRect.top < top;
            (entry.target as HTMLElement).dataset.under = String(under);
          }
        },
        { rootMargin: `-${edge}px 0px 0px 0px`, threshold: [0, 1] },
      );
      items.forEach((item) => next.observe(item));
      observer = next;
    };
    const schedule = (): void => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(connect);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(visual);
    query.addEventListener('change', schedule);
    schedule();
    return () => {
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      query.removeEventListener('change', schedule);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const shutter = shutterRef.current;
    let target = 0;
    let visible = 0;
    let swap: gsap.core.Timeline | null = null;

    const commit = (index: number): void => {
      visible = index;
      setShown(index);
      useMeridianStore.getState().setActiveTech(index);
    };

    const run = (): void => {
      if (swap || target === visible) return;
      if (!shutter) {
        commit(target);
        return;
      }
      const timeline = gsap.timeline({
        defaults: { ease: easings.reveal },
        onComplete: () => {
          swap = null;
          // A newer selection that arrived mid-swap gets its own wipe.
          run();
        },
      });
      if (matches(REDUCED_MOTION_QUERY)) {
        timeline
          .fromTo(shutter, { opacity: 0, clipPath: 'inset(0% 0% 0% 0%)' }, { opacity: 1, duration: durations.s })
          .call(() => commit(target))
          .to(shutter, { opacity: 0, duration: durations.s });
      } else {
        timeline
          .fromTo(
            shutter,
            { opacity: 1, clipPath: 'inset(0% 100% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: durations.s },
          )
          .call(() => commit(target))
          .to(shutter, { clipPath: 'inset(0% 0% 0% 100%)', duration: durations.s });
      }
      swap = timeline;
    };

    controllerRef.current = {
      request: (index) => {
        target = index;
        run();
      },
    };

    return () => {
      swap?.kill();
      controllerRef.current = null;
    };
  }, []);

  const activate = useCallback((index: number) => {
    setSelected(index);
    controllerRef.current?.request(index);
  }, []);

  const current = technologies[shown] ?? technologies[0];

  return (
    <div ref={stageRef} className="tech__stage" style={motionCssVars}>
      <div className="tech__index">
        <h2 id={headingId} className="tech__heading type-meta">
          {heading}
        </h2>
        <ol className="tech__list">
          {technologies.map((technology, index) => (
            <TechnologyItem
              key={technology.id}
              technology={technology}
              index={index}
              active={index === selected}
              onActivate={activate}
            />
          ))}
        </ol>
      </div>

      <div ref={visualRef} className="tech__visual">
        <div
          ref={registerPanel}
          aria-hidden="true"
          className="tech__panel"
          data-fallback={fallback ? 'true' : 'false'}
        >
          {technologies.map((technology, index) => (
            <span
              key={technology.id}
              className="tech__fallback"
              data-visual={technology.visual}
              data-active={index === shown ? 'true' : 'false'}
            />
          ))}
          <span ref={shutterRef} className="tech__shutter" />
        </div>
        <p aria-hidden="true" className="tech__caption type-meta">
          <span>
            {current.number} / {total}
          </span>
          <span>{current.title}</span>
        </p>
      </div>
    </div>
  );
}

interface TechnologyItemProps {
  technology: Technology;
  index: number;
  active: boolean;
  onActivate: (index: number) => void;
}

function TechnologyItem({ technology, index, active, onActivate }: TechnologyItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);

  // The hook observes only where scroll, not hover, selects (coarse / no hover / narrow).
  const onEnter = useCallback(() => onActivate(index), [index, onActivate]);
  useFocusZone(itemRef, { onEnter });

  const onPointerEnter = (event: PointerEvent<HTMLButtonElement>): void => {
    if (event.pointerType === 'mouse' && matches(FINE_POINTER_QUERY)) onActivate(index);
  };

  return (
    <li ref={itemRef} className="tech__item">
      <button
        type="button"
        className="tech__button"
        aria-current={active ? 'true' : undefined}
        onPointerEnter={onPointerEnter}
        onFocus={() => onActivate(index)}
        onClick={() => onActivate(index)}
      >
        <span className="tech__title">{technology.title}</span>{' '}
        <span className="tech__number type-meta">{technology.number}</span>
      </button>
    </li>
  );
}
