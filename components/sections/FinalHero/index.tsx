import { copy } from '../../../data/copy';

export default function FinalHero() {
  return (
    <section id="return" aria-labelledby="final-hero-heading">
      <h2 id="final-hero-heading">
        {copy.finalHero.headline.map((line) => (
          <span key={line}>{line} </span>
        ))}
      </h2>
      <p>{copy.finalHero.supporting}</p>
      <a href={copy.finalHero.cta.href}>{copy.finalHero.cta.label}</a>
    </section>
  );
}
