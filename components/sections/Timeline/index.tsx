import { copy } from '../../../data/copy';
import { timeline } from '../../../data/timeline';

export default function Timeline() {
  return (
    <section id="timeline" data-act="transit" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading">{copy.timeline.heading}</h2>
      <ol>
        {timeline.map((entry) => (
          <li key={entry.year}>
            <h3>{entry.year}</h3>
            <p>{entry.milestone}</p>
            <dl>
              <dt>{copy.timeline.metadataLabels.distance}</dt>
              <dd>{entry.distance}</dd>
              <dt>{copy.timeline.metadataLabels.crew}</dt>
              <dd>{entry.crew}</dd>
              <dt>{copy.timeline.metadataLabels.status}</dt>
              <dd>{entry.status}</dd>
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}
