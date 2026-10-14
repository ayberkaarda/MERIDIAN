'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motionConditions, readConditions } from '@/components/typography/motionQueries';
import { formatStatistic, stats } from '@/data/stats';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { durations, easings, motion } from '@/lib/motion';

interface StatsChoreographyProps {
  children: ReactNode;
}

/**
 * Act III, arrival beat: the distance travelled, read out. Each figure counts
 * up once as the list enters (`xl`, expo.out). Only the numeric part is
 * rewritten, formatted to the figure's fixed decimals on every step, so the
 * digits never jitter between precisions; the suffix never changes.
 * Reduced motion: final values throughout, the list fades in.
 */
export function StatsChoreography({ children }: StatsChoreographyProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const countedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const section = root?.closest('section');
    if (!root || !section) return;
    const items = gsap.utils.toArray<HTMLElement>('[data-stat-item]', root);
    const counters = stats.flatMap((stat) => {
      const element = root.querySelector<HTMLElement>(`[data-stat-numeral="${stat.id}"]`);
      return element ? [{ stat: { ...stat, suffix: '' }, element }] : [];
    });
    const finalText = counters.map(({ stat }) => formatStatistic(stat));

    const mm = gsap.matchMedia();
    mm.add(motionConditions, (context) => {
      const { reduce } = readConditions(context.conditions);

      if (reduce) {
        gsap.fromTo(
          items,
          { opacity: 0 },
          {
            opacity: 1,
            duration: durations.m,
            ease: easings.reveal,
            stagger: motion.headlineStagger,
            scrollTrigger: { trigger: section, start: 'top 75%', once: true },
          },
        );
        return;
      }

      // Counted once per page view: a later motion-preference toggle keeps the final values.
      if (countedRef.current) return;

      const values = counters.map(() => ({ value: 0 }));
      counters.forEach(({ stat, element }) => {
        element.textContent = formatStatistic(stat, 0);
      });

      const count = gsap.timeline({ paused: true });
      count.fromTo(
        items,
        { opacity: 0, yPercent: 24 },
        { opacity: 1, yPercent: 0, duration: durations.l, ease: easings.reveal, stagger: motion.headlineStagger },
        0,
      );
      counters.forEach(({ stat, element }, index) => {
        const value = values[index];
        if (!value) return;
        let shown = '';
        count.to(
          value,
          {
            value: stat.value,
            duration: durations.xl,
            ease: easings.reveal,
            onUpdate: () => {
              const text = formatStatistic(stat, value.value);
              if (text !== shown) {
                shown = text;
                element.textContent = text;
              }
            },
          },
          index * motion.headlineStagger,
        );
      });

      const trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top 70%',
        once: true,
        onEnter: () => {
          countedRef.current = true;
          count.play();
        },
      });

      return () => {
        trigger.kill();
        count.kill();
        counters.forEach(({ element }, index) => {
          element.textContent = finalText[index] ?? element.textContent;
        });
      };
    });

    return () => mm.revert();
  }, [countedRef]);

  return (
    <div ref={rootRef} className="stats__stage">
      {children}
    </div>
  );
}
