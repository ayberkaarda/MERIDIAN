export const durations = { xs: 0.2, s: 0.4, m: 0.8, l: 1.4, xl: 2.4 } as const;
export const easings = { reveal: 'expo.out', camera: 'power2.inOut', scrub: 'none' } as const;
export const motion = { durations, easings, headlineStagger: 0.12 } as const;
// Magnetic return is the sole spring exception in the interaction specification.
export const magneticReturnEase = 'elastic.out(1, 0.6)';
export type MotionDuration = keyof typeof durations;
export type NarrativeBeat = 'departure' | 'distance' | 'arrival' | 'return';
