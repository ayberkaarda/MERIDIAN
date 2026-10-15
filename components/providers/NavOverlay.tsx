"use client";

import { AnimatePresence, LazyMotion, m, type Variants } from "framer-motion";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { acts, copy } from "@/data/copy";
import { footerLinks } from "@/data/footer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { durations, motion as motionScale } from "@/lib/motion";
import { useMeridianStore } from "@/store";
import { bezier, motionCssVars } from "@/components/ui/motion-presets";

const FOCUSABLE_SELECTOR = 'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])';

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durations.s, ease: bezier.reveal } },
  exit: { opacity: 0, transition: { duration: durations.s, ease: bezier.reveal } },
};

interface LineCustom {
  reduced: boolean;
  index: number;
}

// Act titles rise out of their own line box; reduced motion keeps only the fade.
const lineVariants: Variants = {
  hidden: ({ reduced }: LineCustom) => (reduced ? { opacity: 0 } : { y: "105%" }),
  visible: ({ reduced, index }: LineCustom) => {
    const transition = {
      duration: durations.m,
      ease: bezier.reveal,
      delay: durations.xs + index * motionScale.headlineStagger,
    };
    return reduced ? { opacity: 1, transition } : { y: "0%", transition };
  },
};

const metaVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.m, ease: bezier.reveal, delay: durations.s },
  },
};

const loadFeatures = () => import("@/lib/domAnimation").then((module) => module.default);

export function NavOverlay({ open, setOpen, present, onExitComplete, triggerRef, dialogId, titleId }: {
  open: boolean;
  setOpen: (open: boolean) => void;
  present: boolean;
  onExitComplete: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  dialogId: string;
  titleId: string;
}) {
  const reduced = useReducedMotion();
  const activeAct = useMeridianStore((state) => state.activeAct);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), [setOpen]);

  useLayoutEffect(() => {
    if (!present) return;
    const html = document.documentElement;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    html.dataset.menu = "open";

    // The dialog is committed with this render, so focus lands before the entrance animation starts.
    closeRef.current?.focus({ preventScroll: true });

    const background: { element: HTMLElement; inert: boolean; hidden: string | null }[] = [];
    let branch: HTMLElement | null = dialog;
    while (branch?.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling === branch || !(sibling instanceof HTMLElement)) continue;
        background.push({ element: sibling, inert: sibling.inert, hidden: sibling.getAttribute("aria-hidden") });
        sibling.inert = true;
        sibling.setAttribute("aria-hidden", "true");
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
    const onFocusIn = (event: FocusEvent): void => {
      if (dialog && event.target instanceof Node && !dialog.contains(event.target)) closeRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("focusin", onFocusIn);
    // Tab order is driven manually so the cycle is identical across engines
    // (WebKit skips links on Tab by default).
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      event.preventDefault();
      const items = getFocusable(dialog);
      if (items.length === 0) return;
      const current = document.activeElement;
      const index = current instanceof HTMLElement ? items.indexOf(current) : -1;
      const step = event.shiftKey ? -1 : 1;
      const nextIndex =
        index === -1
          ? event.shiftKey
            ? items.length - 1
            : 0
          : (index + step + items.length) % items.length;
      items[nextIndex]?.focus({ preventScroll: true });
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      for (const { element, inert, hidden } of background) {
        element.inert = inert;
        if (hidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", hidden);
      }
      delete html.dataset.menu;
      trigger?.focus({ preventScroll: true });
    };
  }, [present, setOpen, triggerRef]);

  return (
    <LazyMotion features={loadFeatures} strict>
      <AnimatePresence onExitComplete={onExitComplete}>
        {open ? (
          <m.div
            key="nav-overlay"
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="nav-overlay"
            data-lenis-prevent=""
            style={motionCssVars}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="nav-overlay__bar">
              <p id={titleId} className="site-header__wordmark">
                {copy.brand.name}
              </p>
              <button ref={closeRef} type="button" className="nav-toggle type-meta" onClick={close}>
                <span>{copy.navigation.close}</span>
                <span aria-hidden="true" className="nav-toggle__glyph nav-toggle__glyph--close" />
              </button>
            </div>

            <nav aria-labelledby={titleId} className="nav-overlay__body">
              <ol className="nav-acts">
                {acts.map((act, index) => (
                  <li key={act.id} className="nav-acts__item">
                    <a
                      href={act.href}
                      className="nav-acts__link"
                      aria-label={act.label}
                      aria-current={act.id === activeAct ? "location" : undefined}
                      onClick={close}
                    >
                      <span className="nav-acts__numeral type-meta">{act.numeral}</span>
                      <span className="nav-acts__mask">
                        <m.span
                          className="nav-acts__title type-display"
                          variants={lineVariants}
                          custom={{ reduced, index } satisfies LineCustom}
                        >
                          {act.title}
                        </m.span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <m.div className="nav-overlay__foot" variants={metaVariants}>
              <ul className="nav-links">
                {footerLinks.map((link) =>
                  link.disabled ? (
                    <li key={link.label}>
                      <a role="link" aria-disabled="true" className="nav-links__item type-meta">
                        <span>{link.label}</span>
                        <span className="nav-links__status">{link.status}</span>
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <a href={link.href} className="nav-links__item type-meta" onClick={close}>
                        {link.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
              <p className="nav-overlay__meta type-meta">
                <span>{copy.brand.descriptor}</span>
                <span>{copy.brand.year}</span>
              </p>
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  );
}
