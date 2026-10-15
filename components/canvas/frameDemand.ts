/*
 * Frame demand for the render loop. Bodies that change on their own over time
 * (a turning planet, drifting rings, animated shader uniforms) flag themselves
 * here from their frame callbacks; everything else that moves the image goes
 * through the store, the scroll position or the canvas size, which the ticker
 * compares between ticks. When nothing is flagged and nothing changed, the
 * ticker skips the frame.
 */
const animating = new Set<string>();

export function setAnimating(key: string, on: boolean): void {
  if (on) animating.add(key);
  else animating.delete(key);
}

export function hasAnimation(): boolean {
  return animating.size > 0;
}
