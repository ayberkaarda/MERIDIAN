import { copy } from '@/data/copy';
import { timeline } from '@/data/timeline';
import { TimelineChoreography } from './TimelineChoreography';

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Act II · 2.2 Mission Timeline.
 * Desktop (with motion): the stage is held while a horizontal track of five
 * panels travels past. Mobile and reduced motion: a vertical stack; on mobile
 * a large sticky year changes as each card passes.
 * The current year is the only `--accent` element of this act.
 */
export default function Timeline() {
  const { heading, metadataLabels } = copy.timeline;
  const total = pad(timeline.length);
  return (
    <section id="timeline" data-act="transit" aria-labelledby="timeline-heading" className="timeline">
      <TimelineChoreography>
        <header className="timeline__header">
          <h2 id="timeline-heading" className="timeline__heading type-meta">
            {heading}
          </h2>
          <p aria-hidden="true" className="timeline__counter type-meta">
            <span data-timeline-step="">{pad(1)}</span>
            <span className="timeline__counter-separator">/</span>
            <span>{total}</span>
          </p>
        </header>

        <div aria-hidden="true" className="timeline__years">
          {timeline.map((entry, index) => (
            <span
              key={entry.year}
              className="timeline__years-item"
              data-timeline-year={index}
              data-current={index === 0 ? 'true' : 'false'}
            >
              {entry.year}
            </span>
          ))}
        </div>

        <div className="timeline__viewport" data-timeline-viewport="">
          <ol className="timeline__track" data-timeline-track="">
            {timeline.map((entry, index) => (
              <li
                key={entry.year}
                className="timeline__panel"
                data-timeline-panel={index}
                data-current={index === 0 ? 'true' : 'false'}
              >
                <h3 className="timeline__year">
                  <span className="timeline__year-digits">{entry.year}</span>
                  <span aria-hidden="true" className="timeline__year-index type-meta">
                    {pad(index + 1)}
                  </span>
                </h3>
                <div className="timeline__body" data-timeline-reveal="">
                  <p className="timeline__milestone">{entry.milestone}</p>
                  <dl className="timeline__meta type-meta">
                    <div className="timeline__meta-row">
                      <dt>{metadataLabels.distance}</dt>
                      <dd>{entry.distance}</dd>
                    </div>
                    <div className="timeline__meta-row">
                      <dt>{metadataLabels.crew}</dt>
                      <dd>{entry.crew}</dd>
                    </div>
                    <div className="timeline__meta-row">
                      <dt>{metadataLabels.status}</dt>
                      <dd>{entry.status}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <span aria-hidden="true" className="timeline__progress">
          <span className="timeline__progress-fill" data-timeline-progress="" />
        </span>
      </TimelineChoreography>
    </section>
  );
}
