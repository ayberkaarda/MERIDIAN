import { footer } from '../../../data/footer';

export default function Footer() {
  return (
    <footer aria-labelledby="footer-heading">
      <h2 id="footer-heading">{footer.name}</h2>
      <p>{footer.descriptor}</p>
      <p>{footer.year}</p>
      <nav>
        <ul>
          {footer.links.map((link) => (
            <li key={link.label}>
              {link.disabled ? (
                <span aria-disabled="true" aria-label={`${link.label}: ${link.status}`}>
                  {link.label}
                </span>
              ) : (
                <a href={link.href}>{link.label}</a>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <p>{footer.coordinates}</p>
    </footer>
  );
}
