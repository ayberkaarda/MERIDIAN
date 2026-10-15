'use client';

import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';
import { createContext, useContext, type ReactNode } from 'react';

const Content = createContext<ReactNode>(null);
const Deferred = dynamic(() => import('@/lib/deferred/StatsChoreography').then((module) => module.StatsChoreography), { ssr: false, loading: LoadingStage });

export function StatsChoreography({ children }: { children: ReactNode }) {
  const ready = useHydrated();

  if (ready) return <Content.Provider value={children}><Deferred>{children}</Deferred></Content.Provider>;
  return <StaticStage>{children}</StaticStage>;
}


function StaticStage({ children }: { children: ReactNode }) {
  return (
    <div className="stats__stage">
      {children}
    </div>
  );
}

function LoadingStage() {
  return <StaticStage>{useContext(Content)}</StaticStage>;
}
