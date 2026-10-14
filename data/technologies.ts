export type TechnologyVisual = 'plasma' | 'thermal' | 'trajectory' | 'volume';
export interface Technology { id: string; number: string; title: string; label: string; visual: TechnologyVisual }
export const technologies = [
  { id: 'propulsion', number: '01', title: 'ORBITAL PROPULSION', label: 'ORBITAL PROPULSION 01', visual: 'plasma' },
  { id: 'thermal', number: '02', title: 'THERMAL SYSTEMS', label: 'THERMAL SYSTEMS 02', visual: 'thermal' },
  { id: 'navigation', number: '03', title: 'AUTONOMOUS NAVIGATION', label: 'AUTONOMOUS NAVIGATION 03', visual: 'trajectory' },
  { id: 'life-support', number: '04', title: 'LIFE SUPPORT', label: 'LIFE SUPPORT 04', visual: 'volume' },
] as const satisfies readonly Technology[];
