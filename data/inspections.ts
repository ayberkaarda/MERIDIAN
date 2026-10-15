export type CraftPart = 'radiator' | 'docking' | 'bus';
export const inspectionCopy = {
  resume: 'RESUME JOURNEY',
  orbitPrompt: 'Select an orbit to examine its place in the system.',
  craftPrompt: 'Select a component to examine the spacecraft.',
  orbitLabel: 'Inspect the orbital system',
  craftLabel: 'Inspect spacecraft components',
} as const;
export const orbitInspections = [
  { label: 'ORBIT 01', description: 'The inner orbit keeps transfer operations close to the core. A compact path for frequent arrivals.' },
  { label: 'ORBIT 02', description: 'The middle orbit separates assembly from transfer traffic. Space to connect the next stage of the mission.' },
  { label: 'ORBIT 03', description: 'The outer orbit creates room for departure. Infrastructure stretches outward while staying connected to the core.' },
] as const;
export const craftInspections: readonly { id: CraftPart; label: string; description: string }[] = [
  { id: 'radiator', label: 'RADIATOR ARRAY', description: 'Paired radiator wings release waste heat into space, keeping the spacecraft’s working systems within their operating range.' },
  { id: 'docking', label: 'DOCKING RING', description: 'The forward interface connects the spacecraft to orbital infrastructure for transfer, servicing and the next departure.' },
  { id: 'bus', label: 'MAIN BUS', description: 'The central structure carries power, navigation and communications, linking the spacecraft’s modules into one system.' },
];
