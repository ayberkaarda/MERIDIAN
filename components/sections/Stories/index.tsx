import { Fragment } from 'react';
import { InterludeStatement } from '@/components/sections/Interlude/InterludeStatement';
import { ThemeFlip } from '@/components/transitions/ThemeFlip';
import { copy } from '@/data/copy';
import { stories } from '@/data/stories';
import { StoryArticle } from './StoryArticle';

/** The big-typography interlude is spoken after this many stories. */
const INTERLUDE_AFTER = 2;

/**
 * Act III · 3.3-3.4. The section opens on the sun-rise range (the theme flip
 * to day), then three editorial stories in the light theme, with the
 * typographic interlude between the second and the third.
 */
export default function Stories() {
  return (
    <section id="stories" data-act="arrival" aria-labelledby="stories-heading" className="stories">
      <ThemeFlip />
      <div className="stories__body">
        <h2 id="stories-heading" className="stories__heading type-meta">
          {copy.stories.heading}
        </h2>
        {stories.map((story, index) => (
          <Fragment key={story.id}>
            {index === INTERLUDE_AFTER ? <InterludeStatement /> : null}
            <StoryArticle story={story} index={index} />
          </Fragment>
        ))}
      </div>
    </section>
  );
}
