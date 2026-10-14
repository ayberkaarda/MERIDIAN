'use client';

import { useCallback, type RefCallback } from 'react';
import { useMeridianStore } from '@/store';

export function useStoryPanelRegistration(index: number): RefCallback<HTMLElement> {
  return useCallback((element: HTMLElement | null) => {
    useMeridianStore.getState().setStoryPanel(index, element);
  }, [index]);
}
