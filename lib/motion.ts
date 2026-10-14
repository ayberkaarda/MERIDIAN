export const durations = { xs: 0.2, s: 0.4, m: 0.8, l: 1.4, xl: 2.4 } as const;
export const easings = { reveal: 'expo.out', camera: 'power2.inOut', scrub: 'none' } as const;
export const motion = { durations, easings, headlineStagger: 0.12 } as const;
export const magneticReturnEase = 'elastic.out(1, 0.6)';
export type MotionDuration = keyof typeof durations;
export type NarrativeBeat = 'departure' | 'distance' | 'arrival' | 'return';

export const bezier = {
  reveal: [0.16, 1, 0.3, 1],
  camera: [0.455, 0.03, 0.515, 0.955],
  scrub: [0, 0, 1, 1],
} as const satisfies Record<keyof typeof easings, readonly [number, number, number, number]>;