import { copy } from '../../../data/copy';

export default function Manifesto() {
  return (
    <section id="manifesto" aria-labelledby="manifesto-heading">
      <h2 id="manifesto-heading">
        {copy.manifesto.headline.map((line) => (
          <span key={line}>{line} </span>
        ))}
      </h2>
    </section>
  );
}
