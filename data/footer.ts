import { copy } from './copy';

export type FooterLink = { label: string; href: '#departure' | '#transit' | '#arrival'; disabled: false } | { label: string; href: null; disabled: true; ariaDisabled: true; status: string };
export const footerLinks = [
  { label: 'Mission', href: '#departure', disabled: false },
  { label: 'Technology', href: '#transit', disabled: false },
  { label: 'Systems', href: '#arrival', disabled: false },
  { label: 'Journal', href: null, disabled: true, ariaDisabled: true, status: 'Unavailable' },
  { label: 'Contact', href: null, disabled: true, ariaDisabled: true, status: 'Unavailable' },
] as const satisfies readonly FooterLink[];
export const footer = { name: copy.brand.name, descriptor: copy.brand.descriptor, year: copy.brand.year, coordinates: "34°03' N  118°14' W", clockLabel: 'UTC', clockPlaceholder: '--:--:--', navLabel: 'Footer', links: footerLinks } as const;
export function formatUtcClock(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date);
}
