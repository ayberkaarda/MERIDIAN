import { EditorialStatement } from '@/components/typography/EditorialStatement';
import { copy } from '@/data/copy';
import { ManifestoChoreography } from './ManifestoChoreography';

const total = String(copy.manifesto.headline.length).padStart(2, '0');

export default function Manifesto() {
  return (
    <section id="manifesto" aria-labelledby="manifesto-heading" className="manifesto">
      <ManifestoChoreography>
        <EditorialStatement as="h2" id="manifesto-heading" lines={copy.manifesto.headline} className="manifesto__statement" />
        <p aria-hidden="true" className="manifesto__counter type-meta">
          <span data-manifesto-step="">{total}</span>
          <span className="manifesto__counter-separator">/</span>
          <span>{total}</span>
        </p>
      </ManifestoChoreography>
    </section>
  );
}
