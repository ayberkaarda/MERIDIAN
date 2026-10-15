'use client';

import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';
import { createContext, useContext, type ReactNode } from 'react';
import { motionCssVars } from '@/components/ui/motion-presets';

const Content = createContext<ReactNode>(null);
const Deferred = dynamic(() => import('@/lib/deferred/TimelineChoreography').then((module) => module.TimelineChoreography), { ssr: false, loading: LoadingStage });

export function TimelineChoreography({ children }: { children: ReactNode }) {
  const ready = useHydrated();

  if (ready) return <Content.Provider value={children}><Deferred>{children}</Deferred></Content.Provider>;
  return <StaticStage>{children}</StaticStage>;
}


function StaticStage({ children }: { children: ReactNode }) {
  return (
    <div className="timeline__stage" style={motionCssVars}>
      {children}
    </div>
  );
}

function LoadingStage() {
  return <StaticStage>{useContext(Content)}</StaticStage>;
}
