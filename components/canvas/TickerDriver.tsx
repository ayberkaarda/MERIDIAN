'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { addRenderTick } from '@/lib/lenis';

/**
 * Drives the R3F loop (frameloop="never") from the shared gsap ticker so that
 * Lenis raf, ScrollTrigger callbacks (theme writes) and the WebGL draw all
 * happen inside one tick. addRenderTick guarantees this listener runs after
 * the Lenis tick regardless of mount order.
 */
export function TickerDriver() {
  const advance = useThree((state) => state.advance);
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    const hiddenRef = (): boolean => canvas.ownerDocument.visibilityState === 'hidden';
    return addRenderTick(() => {
      if (hiddenRef()) return;
      advance(performance.now());
    });
  }, [advance, canvas]);
  return null;
}
