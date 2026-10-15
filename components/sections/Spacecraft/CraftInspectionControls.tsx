'use client';

import { useEffect, useRef } from 'react';
import { craftInspections, inspectionCopy } from '@/data/inspections';
import { useMeridianStore } from '@/store';

export function CraftInspectionControls() {
  const root = useRef<HTMLDivElement>(null);
  const selected = useMeridianStore((state) => state.selectedCraftPart);
  const select = useMeridianStore((state) => state.selectCraftPart);
  useEffect(() => {
    const section = root.current?.closest('section');
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) useMeridianStore.getState().selectCraftPart(null);
    });
    observer.observe(root.current ?? section);
    const unsubscribe = useMeridianStore.subscribe((state) => {
      if (state.selectedCraftPart !== null && (state.activeAct !== 'arrival' || state.themeProgress > 0)) state.selectCraftPart(null);
    });
    return () => { observer.disconnect(); unsubscribe(); useMeridianStore.getState().selectCraftPart(null); };
  }, []);
  return <div ref={root} className="craft-inspector" data-craft-inspection="" data-selected={selected ?? 'none'}>
    <ol className="craft__labels type-meta" aria-label={inspectionCopy.craftLabel}>
      {craftInspections.map((item, index) => <li key={item.id} className="craft__label" data-craft-label={index} data-slot={index}>
        <button type="button" className="craft-inspector__select" data-craft-select={item.id} aria-pressed={selected === item.id} aria-controls="craft-inspection-description" onClick={() => select(selected === item.id ? null : item.id)}>
          <span className="craft__label-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span className="craft__label-text">{item.label}</span>
        </button>
      </li>)}
    </ol>
    <p id="craft-inspection-description" className="craft-inspector__description" data-inspection-description="" aria-live="polite" aria-atomic="true">{craftInspections.find((item) => item.id === selected)?.description ?? inspectionCopy.craftPrompt}</p>
    <button type="button" className="craft-inspector__reset type-meta" data-inspection-reset="craft" disabled={selected === null} onClick={() => select(null)}>{inspectionCopy.resume}<span aria-hidden="true"> ↗</span></button>
  </div>;
}
