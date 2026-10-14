'use client';

import { useEffect } from 'react';
import { useMeridianStore, type MeridianStore } from '@/store';
import { setTrackedPanels, startPanelRectBridge } from './panelRectCache';

function registeredPanels(state: MeridianStore): HTMLElement[] {
  const panels: HTMLElement[] = [];
  if (state.techPanel) panels.push(state.techPanel);
  for (const panel of state.storyPanels) if (panel) panels.push(panel);
  return panels;
}

/**
 * Measures every registered scene panel (technology + stories) for the
 * canvas. Mount once, early in the client tree (before the canvas), so the
 * measurement flush runs ahead of the render loop each frame. Renders nothing.
 */
export function PanelRectBridge() {
  useEffect(() => {
    const stop = startPanelRectBridge(window);
    setTrackedPanels(registeredPanels(useMeridianStore.getState()));
    const unsubscribe = useMeridianStore.subscribe((state, previous) => {
      if (state.techPanel === previous.techPanel && state.storyPanels === previous.storyPanels) return;
      setTrackedPanels(registeredPanels(state));
    });
    return () => {
      unsubscribe();
      stop();
    };
  }, []);
  return null;
}
