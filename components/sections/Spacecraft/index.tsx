import { copy } from '../../../data/copy';

export default function Spacecraft() {
  return (
    <section id="arrival" aria-labelledby="spacecraft-heading">
      <h2 id="spacecraft-heading">{copy.spacecraft.heading}</h2>
      <ul>
        {copy.spacecraft.labels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </section>
  );
}
