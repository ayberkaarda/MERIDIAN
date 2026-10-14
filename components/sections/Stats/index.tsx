import type { CSSProperties } from 'react';
import { copy } from '@/data/copy';
import { formatStatistic, stats } from '@/data/stats';
import { StatsChoreography } from './StatsChoreography';

/**
 * Act III · 3.2 Data. Four mission figures. The server render is the final,
 * formatted value; the count-up only rewrites the numeric part on the client.
 * Each figure reserves the width of its final numeral, so nothing reflows.
 */
export default function Stats() {
  return (
    <section id="stats" data-act="arrival" aria-labelledby="stats-heading" className="stats">
      <StatsChoreography>
        <h2 id="stats-heading" className="stats__heading type-meta">
          {copy.stats.heading}
        </h2>
        <dl className="stats__list">
          {stats.map((stat, index) => {
            const numeral = formatStatistic({ ...stat, suffix: '' });
            return (
              <div key={stat.id} className="stats__item" data-stat-item="">
                <dt className="stats__label type-meta">
                  <span aria-hidden="true" className="stats__index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{stat.label}</span>
                </dt>
                <dd className="stats__value">
                  <span className="sr-only">{stat.display}</span>
                  <span aria-hidden="true" className="stats__figure">
                    <span
                      className="stats__numeral"
                      data-stat-numeral={stat.id}
                      data-no-refresh=""
                      style={{ '--stat-chars': numeral.length } as CSSProperties}
                    >
                      {numeral}
                    </span>
                    <span className="stats__suffix" data-spaced={stat.suffix.startsWith(' ') ? 'true' : 'false'}>
                      {stat.suffix.trim()}
                    </span>
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </StatsChoreography>
    </section>
  );
}
