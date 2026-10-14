import Lenis from 'lenis';
import { gsap, ScrollTrigger, registerGsap } from './gsap';

export interface LenisController {
  lenis: Lenis;
  destroy: () => void;
}

export function createLenis(reducedMotion = false): LenisController | null {
  if (typeof window === 'undefined' || reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  registerGsap();
  const lenis = new Lenis({ lerp: 0.09, syncTouch: false, autoRaf: false });
  const tick = (time: number): void => lenis.raf(time * 1000);
  const update = (): void => { ScrollTrigger.update(); };
  lenis.on('scroll', update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  let destroyed = false;
  return {
    lenis,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      gsap.ticker.remove(tick);
      lenis.off('scroll', update);
      lenis.destroy();
    },
  };
}
