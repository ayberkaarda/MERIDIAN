export interface TimelineEntry { year: number; milestone: string; distance: string; crew: string; status: string }
// Narrative details complete the five years specified in the brief.
export const timeline = [
  { year: 2032, milestone: 'The first orbital foundation.', distance: '400 km', crew: 'UNCREWED', status: 'COMPLETED' },
  { year: 2038, milestone: 'A permanent foothold above Earth.', distance: '36,000 km', crew: '12', status: 'OPERATIONAL' },
  { year: 2041, milestone: 'Systems built for the distance.', distance: '384,400 km', crew: '24', status: 'OPERATIONAL' },
  { year: 2046, milestone: 'The next horizon is human.', distance: '12,400 km OF INFRASTRUCTURE', crew: '48', status: 'ACTIVE' },
  { year: 2052, milestone: 'Beyond the familiar orbit.', distance: '4.2B km SIMULATED', crew: '96 PLANNED', status: 'PLANNED' },
] as const satisfies readonly TimelineEntry[];
