import { copy } from '../../../data/copy';
import { stats } from '../../../data/stats';

export default function Stats() {
  return (
    <section id="stats" data-act="arrival" aria-labelledby="stats-heading">
      <h2 id="stats-heading">{copy.stats.heading}</h2>
      <dl>
        {stats.map((stat) => (
          <div key={stat.id}>
            <dt>{stat.label}</dt>
            <dd>{stat.display}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
