import { MonoMeta } from '@/components/typography/MonoMeta';
import { SplitHeadline } from '@/components/typography/SplitHeadline';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { copy } from '@/data/copy';
import { HeroChoreography } from './HeroChoreography';

export default function Hero() {
  const { headline, metadata, cta } = copy.hero;
  return (
    <section id="departure" data-act="departure" aria-labelledby="hero-heading" className="hero">
      <HeroChoreography>
        <div className="hero__meta" data-hero-depart="">
          <div data-hero-reveal="">
            <MonoMeta items={metadata} className="hero__meta-line" />
          </div>
        </div>
        <SplitHeadline as="h1" id="hero-heading" lines={headline} className="hero__headline" />
        <div className="hero__cta" data-hero-depart="">
          <div data-hero-reveal="">
            <MagneticButton href={cta.href}>{cta.label}</MagneticButton>
          </div>
        </div>
        <span aria-hidden="true" className="hero__horizon" data-hero-horizon="" />
      </HeroChoreography>
    </section>
  );
}
