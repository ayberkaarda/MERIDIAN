'use client';

import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';
import { createContext, useContext, type ReactNode } from 'react';
import { motionCssVars } from '@/components/ui/motion-presets';
import { copy } from '@/data/copy';

const Content = createContext<ReactNode>(null);
const Deferred = dynamic(() => import('@/lib/deferred/SpacecraftChoreography').then((module) => module.SpacecraftChoreography), { ssr: false, loading: LoadingStage });

export function SpacecraftChoreography({ children }: { children: ReactNode }) {
  const ready = useHydrated();

  if (ready) return <Content.Provider value={children}><Deferred>{children}</Deferred></Content.Provider>;
  return <StaticStage>{children}</StaticStage>;
}


function StaticStage({ children }: { children: ReactNode }) {
  return (
    <div className="craft__stage" style={motionCssVars}>
      <svg aria-hidden="true" focusable="false" className="craft__leaders">
        {copy.spacecraft.labels.map((label) => (
          <g key={label} data-craft-leader="" className="craft__leader">
            <line data-craft-line="" pathLength={1} className="craft__line" />
            <circle data-craft-dot="" r={3} className="craft__dot" />
          </g>
        ))}
      </svg>
      {children}
    </div>
  );
}

function LoadingStage() {
  return <StaticStage>{useContext(Content)}</StaticStage>;
}
