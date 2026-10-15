"use client";

import { useEffect, useRef } from "react";
import { copy } from "@/data/copy";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { gsap } from "@/lib/gsap";
import { durations, easings } from "@/lib/motion";
import { useMediaQuery } from "@/components/ui/use-media-query";

type CursorMode = "idle" | "interactive" | "view";

const INTERACTIVE_SELECTOR =
  'a[href], button:not(:disabled), [role="button"], summary, label[for], [data-cursor]';

// The ring is drawn at its interactive size and scaled down to the dot footprint at rest.
const RING_REST_SCALE = 8 / 40;

function resolveMode(target: EventTarget | null): CursorMode {
  if (!(target instanceof Element)) return "idle";
  const element = target.closest(INTERACTIVE_SELECTOR);
  if (!element || element.getAttribute("aria-disabled") === "true") return "idle";
  return element.getAttribute("data-cursor") === "view" ? "view" : "interactive";
}

export function Cursor() {
  const finePointer = useMediaQuery("(pointer: fine)");
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const followerRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const follower = followerRef.current;
    const label = labelRef.current;
    if (!finePointer || !root || !dot || !follower || !ring || !label) return;

    const html = document.documentElement;
    html.dataset.cursor = "custom";

    // The dot is written synchronously on every pointer event; only the ring trails.
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const follow = { duration: durations.xs, ease: easings.reveal };
    const ringXTo = reduced ? null : gsap.quickTo(follower, "x", follow);
    const ringYTo = reduced ? null : gsap.quickTo(follower, "y", follow);
    const change = { duration: durations.s, ease: easings.reveal, overwrite: "auto" as const };

    let shown = false;
    let mode: CursorMode = "idle";

    gsap.set(root, { autoAlpha: 0 });
    gsap.set(ring, { scale: reduced ? 1 : RING_REST_SCALE, autoAlpha: 0 });
    gsap.set(label, { autoAlpha: 0 });

    const applyMode = (next: CursorMode): void => {
      if (next === mode) return;
      mode = next;
      const engaged = next !== "idle";
      gsap.to(dot, { ...change, autoAlpha: engaged ? 0 : 1 });
      gsap.to(ring, {
        ...change,
        autoAlpha: engaged ? 1 : 0,
        ...(reduced ? {} : { scale: engaged ? 1 : RING_REST_SCALE }),
      });
      gsap.to(label, { ...change, autoAlpha: next === "view" ? 1 : 0 });
    };

    const setShown = (next: boolean): void => {
      if (next === shown) return;
      shown = next;
      gsap.to(root, { duration: durations.xs, ease: easings.reveal, autoAlpha: next ? 1 : 0 });
    };

    const onMove = (event: PointerEvent): void => {
      if (event.pointerType === "touch") return;
      setDotX(event.clientX);
      setDotY(event.clientY);
      if (!ringXTo || !ringYTo) {
        gsap.set(follower, { x: event.clientX, y: event.clientY });
      } else if (!shown) {
        ringXTo(event.clientX, event.clientX);
        ringYTo(event.clientY, event.clientY);
      } else {
        ringXTo(event.clientX);
        ringYTo(event.clientY);
      }
      setShown(true);
    };
    const onOver = (event: PointerEvent): void => applyMode(resolveMode(event.target));
    const onLeave = (event: PointerEvent): void => {
      if (!event.relatedTarget) setShown(false);
    };
    const onBlur = (): void => setShown(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onLeave, { passive: true });
    html.addEventListener("pointerleave", onBlur);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onLeave);
      html.removeEventListener("pointerleave", onBlur);
      window.removeEventListener("blur", onBlur);
      gsap.killTweensOf([root, dot, follower, ring, label]);
      delete html.dataset.cursor;
    };
  }, [finePointer, reduced]);

  if (!finePointer) return null;

  return (
    <div ref={rootRef} aria-hidden="true" className="cursor">
      <span ref={dotRef} className="cursor__dot" />
      <span ref={followerRef} className="cursor__follower">
        <span ref={ringRef} className="cursor__ring" />
        <span ref={labelRef} className="cursor__label type-meta">
          {copy.cursor.view}
        </span>
      </span>
    </div>
  );
}
