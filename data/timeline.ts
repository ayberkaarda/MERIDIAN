export interface TimelineEntry { year: number; milestone: string; distance: string; crew: string; status: string }
// Recorded and planned milestones in MERIDIAN's orbital network.
export const timeline = [
  { year: 2032, milestone: 'First relay placed in low Earth orbit.', distance: '400 km', crew: 'UNCREWED', status: 'COMPLETED' },
  { year: 2038, milestone: 'Crewed station begins continuous operations.', distance: '36,000 km', crew: '12', status: 'OPERATIONAL' },
  { year: 2041, milestone: 'Lunar communications link enters service.', distance: '384,400 km', crew: '24', status: 'OPERATIONAL' },
  { year: 2046, milestone: 'Orbital network supports three habitats.', distance: '12,400 km OF INFRASTRUCTURE', crew: '48', status: 'ACTIVE' },
  { year: 2052, milestone: 'Deep-space transport enters mission planning.', distance: '4.2B km SIMULATED', crew: '96 PLANNED', status: 'PLANNED' },
] as const satisfies readonly TimelineEntry[];
