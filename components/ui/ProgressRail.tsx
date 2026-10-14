"use client";

import { useEffect, useRef } from "react";
import { acts } from "@/data/copy";
import { useMeridianStore } from "@/store";
import { motionCssVars } from "./motion-presets";

// Scroll progress is applied to the fills directly from a store subscription, outside React renders.
export function ProgressRail() {
  const activeAct = useMeridianStore((state) => state.activeAct);
  const reduced = useMeridianStore((state) => state.reducedMotion);
  const verticalFillRef = useRef<HTMLSpanElement>(null);
  const horizontalFillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) {
      verticalFillRef.current?.style.removeProperty("transform");
      horizontalFillRef.current?.style.removeProperty("transform");
      return;
    }
    const apply = (progress: number): void => {
      verticalFillRef.current?.style.setProperty("transform", `scaleY(${progress})`);
      horizontalFillRef.current?.style.setProperty("transform", `scaleX(${progress})`);
    };
    apply(useMeridianStore.getState().scrollProgress);
    return useMeridianStore.subscribe((state, previous) => {
      if (state.scrollProgress !== previous.scrollProgress) apply(state.scrollProgress);
    });
  }, [reduced]);

  return (
    <div aria-hidden="true" style={motionCssVars}>
      <div className="progress-rail">
        <ol className="progress-rail__list">
          {acts.map((act) => (
            <li
              key={act.id}
              className="progress-rail__item type-meta"
              data-active={act.id === activeAct}
            >
              <span className="progress-rail__title">{act.title}</span>
              <span className="progress-rail__numeral">{act.numeral}</span>
            </li>
          ))}
        </ol>
        <span className="progress-rail__track">
          <span ref={verticalFillRef} className="progress-rail__fill" />
        </span>
      </div>

      <div className="progress-bar">
        <span className="progress-bar__labels type-meta">
          {acts.map((act) => (
            <span
              key={act.id}
              className="progress-bar__label"
              data-active={act.id === activeAct}
            >
              {act.label}
            </span>
          ))}
        </span>
        <span className="progress-bar__track">
          <span ref={horizontalFillRef} className="progress-bar__fill" />
        </span>
      </div>
    </div>
  );
}
