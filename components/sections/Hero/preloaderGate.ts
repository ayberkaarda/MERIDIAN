import { durations } from '@/lib/motion';
import { useMeridianStore } from '@/store';

/**
 * Calls `onRelease` once the preloader hands the screen to the hero.
 * When the release is detected as loading completes, the preloader is still
 * holding for one `s` beat before its seam opens, so the delay lets the hero
 * start rising as the planes part. When the preloader has already gone, the
 * delay is zero. Returns a disposer; never polls.
 */
export function onPreloaderRelease(onRelease: (delay: number) => void): () => void {
  const root = document.documentElement;
  let done = false;
  const fire = (delay: number): void => {
    if (done) return;
    done = true;
    dispose();
    onRelease(delay);
  };

  const exited = (): boolean => root.dataset.preloader === 'complete';
  const observer = new MutationObserver(() => {
    if (exited()) fire(0);
  });
  const unsubscribe = useMeridianStore.subscribe((state) => {
    if (state.isLoaded) fire(durations.s);
  });
  function dispose(): void {
    observer.disconnect();
    unsubscribe();
  }

  observer.observe(root, { attributes: true, attributeFilter: ['data-preloader'] });
  if (exited()) fire(0);
  else if (useMeridianStore.getState().isLoaded) fire(durations.s);

  return () => {
    done = true;
    dispose();
  };
}
