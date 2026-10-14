import { copy } from '@/data/copy';
import { TechnologyExplorer } from './TechnologyExplorer';

/**
 * Act II · 2.3 Technology Index. Split screen: the index on the left selects
 * which shader visual the right panel shows. The panel is a window onto the
 * shared scene; a static gradient stands in only without WebGL.
 */
export default function TechnologyIndex() {
  return (
    <section
      id="technology-index"
      data-act="transit"
      aria-labelledby="technology-index-heading"
      className="tech"
    >
      <TechnologyExplorer headingId="technology-index-heading" heading={copy.technologies.heading} />
    </section>
  );
}
