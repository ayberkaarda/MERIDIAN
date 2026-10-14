import { copy } from '../../../data/copy';
import { MagneticButton } from '@/components/ui/MagneticButton';

export default function Hero() {
  return (
    <section id="departure" data-act="departure" aria-labelledby="hero-heading">
      <h1 id="hero-heading">
        {copy.hero.headline.map((line) => (
          <span key={line}>{line} </span>
        ))}
      </h1>
      <p>{copy.hero.metadata.join(' / ')}</p>
      <MagneticButton href={copy.hero.cta.href}>{copy.hero.cta.label}</MagneticButton>
    </section>
  );
}
