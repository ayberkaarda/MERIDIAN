"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";
import { motionCssVars } from "./motion-presets";

export interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  className?: string;
}

export function MagneticButton({ children, href, onClick, className }: MagneticButtonProps) {
  const ref = useMagnetic<HTMLAnchorElement & HTMLButtonElement>();
  const classes = className ? `magnetic-button ${className}` : "magnetic-button";
  const content = (
    <>
      <span className="magnetic-button__label type-meta">{children}</span>
      <span aria-hidden="true" className="magnetic-button__mark" />
    </>
  );

  if (href) {
    return (
      <a ref={ref} href={href} onClick={onClick} className={classes} style={motionCssVars}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} type="button" onClick={onClick} className={classes} style={motionCssVars}>
      {content}
    </button>
  );
}
