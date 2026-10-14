import type { CSSProperties } from "react";
import { bezier, durations, easings } from "@/lib/motion";

type EasingName = keyof typeof easings;
export { bezier } from "@/lib/motion";

const cssBezier = (name: EasingName): string => `cubic-bezier(${bezier[name].join(", ")})`;

// Exposes the duration and easing scale to stylesheets scoped under a UI root.
export const motionCssVars = {
  "--motion-xs": `${durations.xs}s`,
  "--motion-s": `${durations.s}s`,
  "--motion-m": `${durations.m}s`,
  "--motion-l": `${durations.l}s`,
  "--motion-xl": `${durations.xl}s`,
  "--ease-reveal": cssBezier("reveal"),
  "--ease-camera": cssBezier("camera"),
} as CSSProperties;
