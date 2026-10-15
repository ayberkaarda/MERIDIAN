'use client';

import { useEffect, useRef } from 'react';
import { inspectionCopy, orbitInspections } from '@/data/inspections';
import { useMeridianStore } from '@/store';

export function OrbitInspectionControls() {
  const root = useRef<HTMLDivElement>(null);
  const selected = useMeridianStore((state) => state.selectedOrbit);
  const select = useMeridianStore((state) => state.selectOrbit);
  useEffect(() => {
    const section = root.current?.closest('section');
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) useMeridianStore.getState().selectOrbit(null);
    });
    observer.observe(root.current ?? section);
    const unsubscribe = useMeridianStore.subscribe((state) => {
      if (state.selectedOrbit !== null && state.activeAct !== 'transit') state.selectOrbit(null);
    });
    return () => { observer.disconnect(); unsubscribe(); useMeridianStore.getState().selectOrbit(null); };
  }, []);
  return <div ref={root} className="orbit-inspector" data-orbit-inspection="" data-selected={selected ?? 'none'}>
    <ol className="orbital__legend type-meta" aria-label={inspectionCopy.orbitLabel}>
      {orbitInspections.map((item, index) => <li key={item.label} className="orbital__legend-item">
        <button type="button" className="orbit-inspector__select" data-orbit-select={index} aria-pressed={selected === index} aria-controls="orbit-inspection-description" onClick={() => select(selected === index ? null : index)}>
          <span aria-hidden="true" className="orbital__legend-tick" data-ring={index + 1} />
          <span>{item.label}</span>
        </button>
      </li>)}
    </ol>
    <p id="orbit-inspection-description" className="orbit-inspector__description" data-inspection-description="" aria-live="polite" aria-atomic="true">{selected === null ? inspectionCopy.orbitPrompt : orbitInspections[selected]?.description}</p>
    <button type="button" className="orbit-inspector__reset type-meta" data-inspection-reset="orbit" disabled={selected === null} onClick={() => select(null)}>{inspectionCopy.resume}<span aria-hidden="true"> ↗</span></button>
  </div>;
}
