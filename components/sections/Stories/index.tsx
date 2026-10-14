import { copy } from '../../../data/copy';
import { stories } from '../../../data/stories';

export default function Stories() {
  return (
    <section id="stories" data-act="arrival" aria-labelledby="stories-heading">
      <h2 id="stories-heading">{copy.stories.heading}</h2>
      {stories.map((story) => (
        <article key={story.id}>
          <h3>{story.label}</h3>
          <p>{story.headline}</p>
          <p>{story.body}</p>
          <dl>
            {story.metadata.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </section>
  );
}
