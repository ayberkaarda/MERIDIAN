'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { addRenderTick } from '@/lib/lenis';
import { useMeridianStore } from '@/store';
import { hasAnimation } from './frameDemand';

/** Frames still drawn after the last change, so one-frame-late updates land. */
const SETTLE_FRAMES = 3;
/** Longest gap between frames while idle, for changes nothing announces (late mounts, compiles). */
const IDLE_REFRESH_MS = 250;

/**
 * Drives the R3F loop (frameloop="never") from the shared gsap ticker so that
 * Lenis raf, ScrollTrigger callbacks (theme writes) and the WebGL draw all
 * happen inside one tick. addRenderTick guarantees this listener runs after
 * the Lenis tick regardless of mount order.
 *
 * A tick is skipped when nothing can have changed the image: no body is
 * animating on its own, and the store, the scroll position and the canvas size
 * are the same as at the last drawn frame (reduced motion, an idle page).
 */
export function TickerDriver() {
  const advance = useThree((state) => state.advance);
  const get = useThree((state) => state.get);
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    const page = canvas.ownerDocument;
    const view = page.defaultView;
    let lastState: unknown = null;
    let lastSize: unknown = null;
    let lastScroll = Number.NaN;
    let lastDrawn = 0;
    let settle = SETTLE_FRAMES;
    return addRenderTick(() => {
      if (page.visibilityState === 'hidden') return;
      const now = performance.now();
      const state = useMeridianStore.getState();
      const size = get().size;
      const scroll = view ? view.scrollY : 0;
      const changed = hasAnimation() || state !== lastState || size !== lastSize || scroll !== lastScroll;
      if (changed) settle = SETTLE_FRAMES;
      else if (settle > 0) settle -= 1;
      else if (now - lastDrawn < IDLE_REFRESH_MS) return;
      lastState = state;
      lastSize = size;
      lastScroll = scroll;
      lastDrawn = now;
      advance(now / 1000);
    });
  }, [advance, get, canvas]);
  return null;
}
