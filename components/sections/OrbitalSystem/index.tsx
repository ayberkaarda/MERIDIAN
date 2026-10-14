import { MonoMeta } from '@/components/typography/MonoMeta';
import { acts, copy } from '@/data/copy';
import { OrbitalChoreography } from './OrbitalChoreography';

const transit = acts.find((act) => act.id === 'transit');

/**
 * Act II · 2.1 Orbital System. The scene carries the image (core, three
 * inclined rings); this section holds the stage for 200vh and supplies the
 * DOM equivalents of the scene-anchored ORBIT labels.
 * `data-orbit-pin` marks the pinned range read by the orbit scroll bridge.
 */
export default function OrbitalSystem() {
  const { heading, labels } = copy.orbitalSystem;
  return (
    <section
      id="transit"
      data-act="transit"
      data-orbit-pin=""
      aria-labelledby="orbital-system-heading"
      className="orbital"
    >
      <OrbitalChoreography>
        <header className="orbital__header">
          {transit ? (
            <div data-orbital-reveal="">
              <MonoMeta items={[transit.label]} className="orbital__act" />
            </div>
          ) : null}
          <h2 id="orbital-system-heading" className="orbital__heading" data-orbital-reveal="">
            {heading}
          </h2>
        </header>
        <ol className="orbital__legend type-meta">
          {labels.map((label, index) => (
            <li key={label} className="orbital__legend-item" data-orbital-reveal="">
              <span aria-hidden="true" className="orbital__legend-tick" data-ring={index + 1} />
              <span>{label}</span>
            </li>
          ))}
        </ol>
        <span aria-hidden="true" className="orbital__distance">
          <span className="orbital__distance-fill" data-orbital-distance="" />
        </span>
      </OrbitalChoreography>
    </section>
  );
}
