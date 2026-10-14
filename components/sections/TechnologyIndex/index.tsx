import { copy } from '../../../data/copy';
import { technologies } from '../../../data/technologies';

export default function TechnologyIndex() {
  return (
    <section aria-labelledby="technology-index-heading">
      <h2 id="technology-index-heading">{copy.technologies.heading}</h2>
      <ol>
        {technologies.map((technology) => (
          <li key={technology.id}>{technology.label}</li>
        ))}
      </ol>
    </section>
  );
}
