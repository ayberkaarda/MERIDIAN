import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { durations, easings } from './motion';

export function registerGsap(): void {
  if (typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ duration: durations.m, ease: easings.reveal });
}

registerGsap();
export { gsap, ScrollTrigger, SplitText };
