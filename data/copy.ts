export type ActId = 'departure' | 'transit' | 'arrival' | 'return';
export interface Act { id: ActId; numeral: string; title: string; label: string; href: `#${ActId}` }
export const acts = [
  { id: 'departure', numeral: 'I', title: 'DEPARTURE', label: 'I DEPARTURE', href: '#departure' },
  { id: 'transit', numeral: 'II', title: 'TRANSIT', label: 'II TRANSIT', href: '#transit' },
  { id: 'arrival', numeral: 'III', title: 'ARRIVAL', label: 'III ARRIVAL', href: '#arrival' },
  { id: 'return', numeral: 'IV', title: 'RETURN', label: 'IV RETURN', href: '#return' },
] as const satisfies readonly Act[];
export const copy = {
  brand: { name: 'MERIDIAN', descriptor: 'ORBITAL SYSTEMS', year: '2046', statement: 'BEYOND THE KNOWN.', lead: 'THE NEXT HORIZON IS HUMAN.' },
  metadata: { title: 'MERIDIAN — Orbital Systems', description: 'MERIDIAN is building the infrastructure for humanity\'s next chapter.' },
  preloader: { wordmark: 'MERIDIAN', status: 'INITIALIZING SYSTEM' },
  hero: { headline: ['THE NEXT', 'HORIZON', 'IS HUMAN.'], metadata: ['MERIDIAN', 'ORBITAL SYSTEMS', '2046'], cta: { label: 'ENTER THE MISSION', href: '#transit' } },
  manifesto: { headline: ['WE WERE NEVER', 'MEANT TO STAY', 'IN ONE PLACE.'] },
  orbitalSystem: { heading: 'Orbital System', labels: ['ORBIT 01', 'ORBIT 02', 'ORBIT 03'] },
  timeline: { heading: 'Mission Timeline', metadataLabels: { distance: 'DISTANCE', crew: 'CREW', status: 'STATUS' } },
  technologies: { heading: 'Technology Index' },
  spacecraft: { heading: 'Spacecraft', labels: ['RADIATOR ARRAY', 'DOCKING RING', 'MAIN BUS'] },
  stats: { heading: 'Mission Data' },
  stories: { heading: 'Editorial Stories', interlude: ['EARTH', 'WAS', 'ONLY', 'THE', 'BEGINNING.'] },
  finalHero: { headline: ['BEYOND', 'THE KNOWN.'], supporting: 'MERIDIAN is building the infrastructure for humanity\'s next chapter.', cta: { label: 'EXPLORE MERIDIAN', href: '#departure' } },
  navigation: { menu: 'MENU', close: 'CLOSE', skipLink: 'Skip to main content' },
  cursor: { view: 'VIEW' },
} as const;
export type SiteCopy = typeof copy;
export function formatLoadingProgress(progress: number): string {
  return String(Math.round(Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0)).padStart(3, '0');
}
