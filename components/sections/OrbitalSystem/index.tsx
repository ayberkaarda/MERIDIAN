import { copy } from '../../../data/copy';

export default function OrbitalSystem() {
  return (
    <section id="transit" aria-labelledby="orbital-system-heading">
      <h2 id="orbital-system-heading">{copy.orbitalSystem.heading}</h2>
      <ul>
        {copy.orbitalSystem.labels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </section>
  );
}
