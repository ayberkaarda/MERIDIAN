import { footer } from '@/data/footer';
import { UtcClock } from './UtcClock';

/**
 * Act IV · 4.2. Minimal colophon: identity, act anchors, position and time.
 * Journal and Contact are placeholders: present, labelled as unavailable and
 * marked aria-disabled, so nothing pretends to be a working link.
 */
export default function Footer() {
  return (
    <footer id="footer" aria-labelledby="footer-heading" className="site-footer">
      <div className="site-footer__identity">
        <h2 id="footer-heading" className="site-footer__name">
          {footer.name}
        </h2>
        <p className="site-footer__descriptor type-meta">
          <span>{footer.descriptor}</span>
          <span>{footer.year}</span>
        </p>
      </div>

      <nav aria-label={footer.navLabel} className="site-footer__nav">
        <ul className="site-footer__links">
          {footer.links.map((link) => (
            <li key={link.label}>
              {link.disabled ? (
                <a role="link" aria-disabled="true" className="site-footer__link type-meta">
                  <span>{link.label}</span>
                  <span className="site-footer__status">{link.status}</span>
                </a>
              ) : (
                <a href={link.href} className="site-footer__link type-meta">
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="site-footer__position">
        <p className="site-footer__coordinates type-meta">{footer.coordinates}</p>
        <UtcClock />
      </div>
    </footer>
  );
}
