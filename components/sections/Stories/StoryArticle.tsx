'use client';

import { useEffect, useRef } from 'react';
import { motionConditions, readConditions } from '@/components/typography/motionQueries';
import type { Story } from '@/data/stories';
import { useStoryPanelRegistration } from '@/hooks/useStoryPanelRegistration';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { durations, easings, motion } from '@/lib/motion';
import { useMeridianStore } from '@/store';
import { usePanelFallback } from '@/components/sections/panelFallback';

interface StoryArticleProps {
  story: Story;
  index: number;
}

/** Resting scale the panel settles to from its approach scale. */
const APPROACH_SCALE = 1.12;

/**
 * Act III, arrival beat: what the journey is for, told in three stories.
 * - The panel is revealed by a clip-path wipe on the panel itself once it
 *   enters (triggered; the scene narrows its scissor to the same clip),
 *   and settles from 1.12 to 1.0 as it travels to the centre (scrubbed, the
 *   parallax of an image coming into focus). The panel element itself is the
 *   rect the scene draws the story's shader into; it stays transparent.
 * - Headline, body and metadata rise in once, after the panel.
 * - While the article holds the reading line it is the store's active story.
 * Reduced motion: no scale, no wipe; the panel is simply present and the
 * text fades in (opacity only).
 */
export function StoryArticle({ story, index }: StoryArticleProps) {
  const articleRef = useRef<HTMLElement>(null);
  const registerPanel = useStoryPanelRegistration(index);
  const fallback = usePanelFallback();
  const headingId = `story-${story.id}-heading`;

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    const frame = article.querySelector<HTMLElement>('[data-story-frame]');
    const panel = article.querySelector<HTMLElement>('[data-story-panel]');
    const texts = gsap.utils.toArray<HTMLElement>('[data-story-reveal]', article);
    if (!frame || !panel) return;

    const active = ScrollTrigger.create({
      trigger: article,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) useMeridianStore.getState().setActiveStory(index);
      },
    });

    const mm = gsap.matchMedia();
    mm.add(motionConditions, (context) => {
      const { reduce } = readConditions(context.conditions);

      if (reduce) {
        const reveal = gsap.timeline({
          defaults: { duration: durations.m, ease: easings.reveal },
          scrollTrigger: { trigger: frame, start: 'top 80%', once: true },
        });
        // The panel itself is drawn by the scene and cannot fade; only the text does.
        reveal.fromTo(texts, { opacity: 0 }, { opacity: 1, stagger: motion.headlineStagger }, 0);
        return;
      }

      const reveal = gsap.timeline({
        defaults: { ease: easings.reveal },
        scrollTrigger: { trigger: frame, start: 'top 80%', once: true },
      });
      reveal
        .fromTo(
          panel,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: durations.l },
          0,
        )
        .fromTo(
          texts,
          { opacity: 0, yPercent: 40 },
          { opacity: 1, yPercent: 0, duration: durations.l, stagger: motion.headlineStagger },
          durations.s,
        );

      gsap.fromTo(
        panel,
        { scale: APPROACH_SCALE },
        {
          scale: 1,
          ease: easings.scrub,
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'center center', scrub: true },
        },
      );
    });

    return () => {
      active.kill();
      mm.revert();
    };
  }, [index]);

  return (
    <article
      ref={articleRef}
      className="story"
      data-align={story.alignment}
      data-story={story.id}
      aria-labelledby={headingId}
    >
      <div className="story__frame" data-story-frame="">
        <div
          ref={registerPanel}
          aria-hidden="true"
          className="story__panel"
          data-story-panel=""
          data-cursor="view"
          data-fallback={fallback ? 'true' : 'false'}
        >
          <span className="story__fallback" data-visual={story.visual} />
        </div>
      </div>

      <div className="story__text">
        <h3 id={headingId} className="story__heading">
          <span className="story__label type-meta" data-story-reveal="">
            {story.label}
          </span>{' '}
          <span className="story__headline" data-story-reveal="">
            {story.headline}
          </span>
        </h3>
        <p className="story__body" data-story-reveal="">
          {story.body}
        </p>
        <dl className="story__meta type-meta" data-story-reveal="">
          {story.metadata.map((item) => (
            <div key={item.label} className="story__meta-row">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
