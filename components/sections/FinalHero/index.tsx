import { copy } from '../../../data/copy';
import { MagneticButton } from '@/components/ui/MagneticButton';

export default function FinalHero() {
  return (
    <section id="return" data-act="return" aria-labelledby="final-hero-heading">
      <h2 id="final-hero-heading">
        {copy.finalHero.headline.map((line) => (
          <span key={line}>{line} </span>
        ))}
      </h2>
      <p>{copy.finalHero.supporting}</p>
      <MagneticButton href={copy.finalHero.cta.href}>{copy.finalHero.cta.label}</MagneticButton>
    </section>
  );
}
