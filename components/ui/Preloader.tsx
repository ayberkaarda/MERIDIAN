"use client";

import { useEffect, useRef, useState } from "react";
import { copy, formatLoadingProgress } from "@/data/copy";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { durations } from "@/lib/motion";
import { useMeridianStore } from "@/store";
import { bezier, motionCssVars } from "./motion-presets";

const easing = (values: readonly number[]) => `cubic-bezier(${values.join(",")})`;

export function Preloader() {
  const progress = useMeridianStore((state) => state.loadingProgress);
  const reduced = useReducedMotion();
  const [exited, setExited] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const loading = progress < 100;

  useEffect(() => {
    if (!loading) return;
    const root = document.documentElement;
    root.dataset.loading = "true";
    return () => { delete root.dataset.loading; };
  }, [loading]);

  useEffect(() => {
    const seam = rootRef.current?.querySelector<HTMLElement>(".preloader__seam");
    if (!seam || !loading) return;
    const pulse = seam.animate(
      reduced ? [{ opacity: 0.48 }, { opacity: 0.48 }] : [{ opacity: 0.16 }, { opacity: 0.72 }],
      { duration: durations.xl * 1000, easing: easing(bezier.camera), iterations: Infinity, direction: "alternate", fill: "both" },
    );
    return () => { seam.style.opacity = getComputedStyle(seam).opacity; pulse.cancel(); };
  }, [loading, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (loading || exited || !root) return;
    let disposed = false;
    const animations: Animation[] = [];
    const play = (selector: string, frames: Keyframe[], duration: number = durations.l, delay: number = durations.s) => {
      const element = root.querySelector<HTMLElement>(selector);
      if (!element) return;
      const animation = element.animate(frames, {
        duration: duration * 1000, delay: delay * 1000, easing: easing(bezier.reveal), fill: "both",
      });
      animations.push(animation);
    };
    play(".preloader__plane--top", reduced ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: "translateY(0%)" }, { transform: "translateY(-100%)" }]);
    play(".preloader__plane--bottom", reduced ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: "translateY(0%)" }, { transform: "translateY(100%)" }]);
    if (!reduced) play(".preloader__wordmark", [{ transform: "scale(1)" }, { transform: "scale(1.08)" }]);
    play(".preloader__wordmark", [{ opacity: 1 }, { opacity: 0 }], reduced ? durations.l : durations.m);
    const seam = root.querySelector<HTMLElement>(".preloader__seam");
    play(".preloader__seam", [{ opacity: seam ? getComputedStyle(seam).opacity : 0.16 }, { opacity: 0 }], durations.xs, 0);
    void Promise.all(animations.map((animation) => animation.finished)).then(() => {
      if (disposed) return;
      document.documentElement.dataset.preloader = "complete";
      setExited(true);
    }).catch(() => {});
    return () => { disposed = true; animations.forEach((animation) => animation.cancel()); };
  }, [loading, reduced, exited]);

  if (exited) return null;
  return (
    <div ref={rootRef} className="preloader" style={motionCssVars}>
      <div className="preloader__plane preloader__plane--top" />
      <div className="preloader__plane preloader__plane--bottom">
        <div className="preloader__meta type-meta" role="progressbar"
          aria-label={copy.preloader.status} aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={Math.round(progress)}>
          <span>{copy.preloader.status}</span>
          <span className="tabular-nums">{formatLoadingProgress(progress)}</span>
        </div>
      </div>
      <span aria-hidden="true" className="preloader__seam" style={{ opacity: reduced ? 0.48 : 0.16 }} />
      <p className="preloader__wordmark type-display">{copy.preloader.wordmark}</p>
    </div>
  );
}
