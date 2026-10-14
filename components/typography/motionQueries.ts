/** Media conditions shared by every section choreography (gsap.matchMedia). */
export const motionConditions = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

export interface MotionConditionFlags {
  motion: boolean;
  reduce: boolean;
}

export function readConditions(conditions: gsap.Conditions | undefined): MotionConditionFlags {
  return { motion: Boolean(conditions?.motion), reduce: Boolean(conditions?.reduce) };
}
