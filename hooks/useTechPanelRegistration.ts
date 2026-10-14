'use client';

import { useCallback, type RefCallback } from 'react';
import { useMeridianStore } from '@/store';

export function useTechPanelRegistration(): RefCallback<HTMLElement> {
  return useCallback((element: HTMLElement | null) => {
    useMeridianStore.getState().setTechPanel(element);
  }, []);
}
