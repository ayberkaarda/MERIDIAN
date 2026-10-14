'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { motionConditions, readConditions } from '@/components/typography/motionQueries';
import { motionCssVars } from '@/components/ui/motion-presets';
import { copy } from '@/data/copy';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { durations, easings } from '@/lib/motion';

/** One entrance per word, in reading order. */
const EFFECTS = ['rise', 'mask-wipe', 'scale', 'blur-in', 'tracking-in'] as const;
type Effect = (typeof EFFECTS)[number];

const effectFor = (index: number): Effect => EFFECTS[index % EFFECTS.length] ?? 'rise';

const entrances: Record<Effect, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
  rise: { from: { yPercent: 110 }, to: { yPercent: 0 } },
  'mask-wipe': { from: { clipPath: 'inset(0% 100% 0% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' } },
  scale: { from: { scale: 0.42, opacity: 0 }, to: { scale: 1, opacity: 1 } },
  'blur-in': { from: { filter: 'blur(24px)', opacity: 0 }, to: { filter: 'blur(0px)', opacity: 1 } },
  'tracking-in': { from: { letterSpacing: '0.42em', opacity: 0 }, to: { letterSpacing: '-0.04em', opacity: 1 } },
};

/**
 * Act III, arrival beat turning toward return: one sentence, one word at a
 * time, each with its own entrance (rise, mask-wipe, scale, blur-in,
 * tracking-in), set in extreme whitespace. Triggered as each word reaches the
 * reading line, never scrubbed. Reduced motion: every word fades in.
 */
export function InterludeStatement() {
  const rootRef = useRef<HTMLDivElement>(null);
  const words = copy.stories.interlude;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = gsap.utils.toArray<HTMLElement>('[data-interlude-word]', root);

    const mm = gsap.matchMedia();
    mm.add(motionConditions, (context) => {
      const { reduce } = readConditions(context.conditions);
      const triggers = items.map((item, index) => {
        const glyphs = item.querySelector<HTMLElement>('[data-interlude-glyphs]') ?? item;
        const entrance = entrances[effectFor(index)];
        const tween = reduce
          ? gsap.fromTo(glyphs, { opacity: 0 }, { opacity: 1, duration: durations.m, ease: easings.reveal, paused: true })
          : gsap.fromTo(glyphs, entrance.from, {
              ...entrance.to,
              duration: durations.xl,
              ease: easings.reveal,
              paused: true,
            });
        return ScrollTrigger.create({
          trigger: item,
          start: 'top 78%',
          once: true,
          onEnter: () => tween.play(),
        });
      });
      return () => triggers.forEach((trigger) => trigger.kill());
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="interlude" style={motionCssVars}>
      <h3 className="interlude__statement">
        {words.map((word, index) => (
          <span
            key={word}
            className="interlude__word"
            data-interlude-word=""
            data-effect={effectFor(index)}
            style={{ '--word-index': index } as CSSProperties}
          >
            <span className="interlude__glyphs" data-interlude-glyphs="">
              {word}
            </span>
            {index < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </h3>
    </div>
  );
}
