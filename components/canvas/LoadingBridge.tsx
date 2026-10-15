'use client';

import { useEffect } from 'react';
import { DefaultLoadingManager } from 'three';
import { useMeridianStore } from '@/store';

/**
 * Reports scene asset progress from three's default loading manager (every
 * loader uses it unless given another). Completion itself is published by the
 * app shell, so the scene never reports more than 99.
 */
export function LoadingBridge() {
  useEffect(() => {
    const manager = DefaultLoadingManager;
    const previous = { onStart: manager.onStart, onProgress: manager.onProgress, onLoad: manager.onLoad };
    const publish = (loaded: number, total: number): void => {
      const progress = total > 0 ? (loaded / total) * 100 : 100;
      useMeridianStore.getState().setLoadingProgress(Math.min(99, progress));
    };
    manager.onStart = (url, loaded, total) => {
      previous.onStart?.(url, loaded, total);
      publish(loaded, total);
    };
    manager.onProgress = (url, loaded, total) => {
      previous.onProgress?.(url, loaded, total);
      publish(loaded, total);
    };
    manager.onLoad = () => {
      previous.onLoad?.();
      publish(1, 1);
    };
    return () => {
      manager.onStart = previous.onStart;
      manager.onProgress = previous.onProgress;
      manager.onLoad = previous.onLoad;
    };
  }, []);

  return null;
}
