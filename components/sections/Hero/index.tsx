import { copy } from '../../../data/copy';

export default function Hero() {
  return (
    <section id="departure" aria-labelledby="hero-heading">
      <h1 id="hero-heading">
        {copy.hero.headline.map((line) => (
          <span key={line}>{line} </span>
        ))}
      </h1>
      <p>{copy.hero.metadata.join(' / ')}</p>
      <a href={copy.hero.cta.href}>{copy.hero.cta.label}</a>
    </section>
  );
}
