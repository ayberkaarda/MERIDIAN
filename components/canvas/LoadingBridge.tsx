'use client';

import { useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { useMeridianStore } from '@/store';

export function LoadingBridge() {
  const { progress } = useProgress();

  useEffect(() => {
    useMeridianStore.getState().setLoadingProgress(Math.min(99, progress));
  }, [progress]);

  return null;
}
