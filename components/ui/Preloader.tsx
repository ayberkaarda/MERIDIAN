"use client";

import { AnimatePresence, motion, type TargetAndTransition, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { copy, formatLoadingProgress } from "@/data/copy";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { durations } from "@/lib/motion";
import { useMeridianStore } from "@/store";
import { bezier, motionCssVars } from "./motion-presets";

// The exit holds on 100 for one `s` beat, then opens over `l`.
const exitTransition = { duration: durations.l, ease: bezier.reveal, delay: durations.s };
const fadeOut = { opacity: 0, transition: exitTransition };

const topPlane: Variants = {
  visible: { y: "0%", opacity: 1 },
  exit: (reduced: boolean) => (reduced ? fadeOut : { y: "-100%", transition: exitTransition }),
};

const bottomPlane: Variants = {
  visible: { y: "0%", opacity: 1 },
  exit: (reduced: boolean) => (reduced ? fadeOut : { y: "100%", transition: exitTransition }),
};

const wordmark: Variants = {
  visible: { scale: 1, opacity: 1 },
  exit: (reduced: boolean) =>
    reduced
      ? fadeOut
      : {
          scale: 1.08,
          opacity: 0,
          transition: {
            scale: exitTransition,
            opacity: { duration: durations.m, ease: bezier.reveal, delay: durations.s },
          },
        },
};

// A slow, regular metronome; static under reduced motion.
const SEAM_LOW = 0.16;
const seamPulse: TargetAndTransition = {
  opacity: [SEAM_LOW, 0.72],
  transition: {
    duration: durations.xl,
    ease: bezier.camera,
    repeat: Infinity,
    repeatType: "mirror",
  },
};
const seamStatic: TargetAndTransition = { opacity: 0.48 };
const seamExit = { opacity: 0, transition: { duration: durations.xs, ease: bezier.reveal } };

export function Preloader() {
  const progress = useMeridianStore((state) => state.loadingProgress);
  const reduced = useReducedMotion();
  const [exited, setExited] = useState(false);
  const loading = progress < 100;
  const visible = loading && !exited;

  useEffect(() => {
    if (!loading) return;
    const root = document.documentElement;
    root.dataset.loading = "true";
    return () => {
      delete root.dataset.loading;
    };
  }, [loading]);

  const handleExitComplete = (): void => {
    document.documentElement.dataset.preloader = "complete";
    setExited(true);
  };

  return (
    <AnimatePresence custom={reduced} onExitComplete={handleExitComplete}>
      {visible ? (
        <motion.div
          key="preloader"
          className="preloader"
          style={motionCssVars}
          initial={false}
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="preloader__plane preloader__plane--top"
            variants={topPlane}
            custom={reduced}
          />
          <motion.div
            className="preloader__plane preloader__plane--bottom"
            variants={bottomPlane}
            custom={reduced}
          >
            <div
              className="preloader__meta type-meta"
              role="progressbar"
              aria-label={copy.preloader.status}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <span>{copy.preloader.status}</span>
              <span className="tabular-nums">{formatLoadingProgress(progress)}</span>
            </div>
          </motion.div>
          <motion.span
            key={reduced ? "seam-static" : "seam-pulse"}
            aria-hidden="true"
            className="preloader__seam"
            initial={reduced ? seamStatic : { opacity: SEAM_LOW }}
            animate={reduced ? seamStatic : seamPulse}
            exit={seamExit}
          />
          <motion.p
            className="preloader__wordmark type-display"
            variants={wordmark}
            custom={reduced}
          >
            {copy.preloader.wordmark}
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
