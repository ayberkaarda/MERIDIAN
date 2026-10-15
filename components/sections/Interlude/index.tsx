import { ThemeSet } from '@/components/transitions/ThemeFlip';

/**
 * Opening of Act IV. The typographic interlude itself is spoken inside the
 * stories (between the second and the third, see InterludeStatement); what
 * remains here is the sun-set range: open scroll in which the scene lets the
 * sun go down and the page returns to night. It already belongs to the return
 * act, so the scene holds its return state while the disc sinks and the
 * progress rail reads IV as the theme turns back.
 */
export default function Interlude() {
  return (
    <div data-act="return" className="return-set">
      <ThemeSet />
    </div>
  );
}
