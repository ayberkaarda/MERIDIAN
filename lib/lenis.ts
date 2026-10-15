import type Lenis from 'lenis';
import { gsap, ScrollTrigger, registerGsap } from './gsap';

export interface LenisController {
  lenis: Lenis;
  destroy: () => void;
}

// gsap.ticker runs listeners in insertion order. The render ticks (R3F advance)
// must run after Lenis raf -> ScrollTrigger.update so DOM theme writes and the
// WebGL draw land in the same tick. Lenis may be created after the canvas
// mounts, so render ticks are re-queued behind the Lenis tick on creation.
const renderTicks = new Set<() => void>();

export function addRenderTick(callback: () => void): () => void {
  const wrapped = (): void => callback();
  renderTicks.add(wrapped);
  gsap.ticker.add(wrapped);
  return () => {
    renderTicks.delete(wrapped);
    gsap.ticker.remove(wrapped);
  };
}

export async function createLenis(reducedMotion = false): Promise<LenisController | null> {
  if (typeof window === 'undefined' || reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const { default: Lenis } = await import('lenis');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  registerGsap();
  const lenis = new Lenis({ lerp: 0.09, syncTouch: false, autoRaf: false });
  lenis.scrollTo(window.scrollY, { immediate: true });
  const tick = (time: number): void => lenis.raf(time * 1000);
  const update = (): void => { ScrollTrigger.update(); };
  lenis.on('scroll', update);
  gsap.ticker.add(tick);
  for (const render of renderTicks) {
    gsap.ticker.remove(render);
    gsap.ticker.add(render);
  }
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
