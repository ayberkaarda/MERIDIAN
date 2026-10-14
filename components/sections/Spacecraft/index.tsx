import { MonoMeta } from '@/components/typography/MonoMeta';
import { acts, copy } from '@/data/copy';
import { SpacecraftChoreography } from './SpacecraftChoreography';

const arrival = acts.find((act) => act.id === 'arrival');

/**
 * Act III · 3.1 Spacecraft. The scene carries the craft while the camera
 * orbits it; this section holds the stage for 250vh (`data-craft-pin` marks
 * the pinned range read by the craft scroll bridge) and owns the three part
 * labels. Each label is real DOM text, so it is also the accessible
 * equivalent of the scene anchor it points at; leader lines are decorative.
 */
export default function Spacecraft() {
  const { heading, labels } = copy.spacecraft;
  return (
    <section
      id="arrival"
      data-act="arrival"
      data-craft-pin=""
      aria-labelledby="spacecraft-heading"
      className="craft"
    >
      <SpacecraftChoreography>
        <header className="craft__header">
          {arrival ? <MonoMeta items={[arrival.label]} className="craft__act" /> : null}
          <h2 id="spacecraft-heading" className="craft__heading">
            {heading}
          </h2>
        </header>
        <ol className="craft__labels type-meta">
          {labels.map((label, index) => (
            <li key={label} className="craft__label" data-craft-label={index} data-slot={index}>
              <span aria-hidden="true" className="craft__label-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="craft__label-text">{label}</span>
            </li>
          ))}
        </ol>
        <span aria-hidden="true" className="craft__distance">
          <span className="craft__distance-fill" data-craft-distance="" />
        </span>
      </SpacecraftChoreography>
    </section>
  );
}
