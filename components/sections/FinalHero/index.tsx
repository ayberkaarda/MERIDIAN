import { MagneticButton } from '@/components/ui/MagneticButton';
import { acts, copy } from '@/data/copy';
import { FinalHeroChoreography } from './FinalHeroChoreography';

const returnAct = acts.find((act) => act.id === 'return');

/**
 * Act IV · 4.1. The sun has set (the set range precedes this section, see
 * Interlude) and the page is night again. The headline is the image: two
 * lines set as one block that runs from edge to edge of the canvas, with the
 * returning planet behind it. Supporting line and CTA close the loop.
 */
export default function FinalHero() {
  const { headline, supporting, cta } = copy.finalHero;
  return (
    <section id="return" data-act="return" aria-labelledby="final-hero-heading" className="final-hero">
      <FinalHeroChoreography>
        {returnAct ? (
          <p className="final-hero__kicker type-meta" data-final-reveal="">
            {returnAct.label}
          </p>
        ) : null}
        <h2 id="final-hero-heading" className="final-hero__headline">
          {headline.map((line, index) => (
            <span key={line} className="final-hero__mask" data-final-line="">
              <span className="final-hero__line" data-final-glyphs="">
                {line}
              </span>
              {index < headline.length - 1 ? ' ' : null}
            </span>
          ))}
        </h2>
        <p className="final-hero__supporting type-body" data-final-reveal="">
          {supporting}
        </p>
        <div className="final-hero__cta" data-final-reveal="">
          <MagneticButton href={cta.href}>{cta.label}</MagneticButton>
        </div>
      </FinalHeroChoreography>
    </section>
  );
}
