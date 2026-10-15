"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { NavOverlay as OverlayComponent } from "@/components/providers/NavOverlay";
import { acts, copy } from "@/data/copy";
import { scheduleIdle } from "@/lib/scheduleIdle";
import { motionCssVars } from "./motion-presets";

let overlayPromise: Promise<typeof OverlayComponent> | undefined;
const loadOverlay = () => overlayPromise ??= import("@/components/providers/NavOverlay").then((module) => module.NavOverlay);

export function Nav() {
  const [Overlay, setOverlay] = useState<typeof OverlayComponent | null>(null);
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const titleId = useId();
  const requested = useRef(false);
  useEffect(() => {
    let disposed = false;
    const cancel = scheduleIdle(() => {
      void loadOverlay().then((component) => { if (!disposed) setOverlay(() => component); }).catch(() => { overlayPromise = undefined; });
    });
    return () => { disposed = true; requested.current = false; cancel(); };
  }, []);
  const openMenu = () => {
    requested.current = true;
    setOpen(true);
    void loadOverlay().then((component) => {
      if (!requested.current) return;
      setOverlay(() => component);
      setPresent(true);
    }).catch(() => { overlayPromise = undefined; setOpen(false); });
  };
  return (
    <>
      <header className="site-header" style={motionCssVars}>
        <a href={acts[0].href} className="site-header__wordmark">
          {copy.brand.name}
        </a>
        <button
          ref={triggerRef}
          type="button"
          className="nav-toggle type-meta"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          onClick={openMenu}
          onPointerEnter={() => { void loadOverlay().catch(() => { overlayPromise = undefined; }); }}
          onFocus={() => { void loadOverlay().catch(() => { overlayPromise = undefined; }); }}
        >
          <span>{copy.navigation.menu}</span>
          <span aria-hidden="true" className="nav-toggle__glyph" />
        </button>
      </header>
      {Overlay ? <Overlay open={open && present} present={present} setOpen={setOpen}
        triggerRef={triggerRef} dialogId={dialogId} titleId={titleId}
        onExitComplete={() => { requested.current = false; setPresent(false); }} /> : null}
    </>
  );
}
