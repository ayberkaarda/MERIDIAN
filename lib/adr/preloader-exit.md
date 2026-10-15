# ADR: Preloader exit with Web Animations

Status: Accepted

Section 3 assigns DOM UI transitions, including the preloader exit, to Framer Motion.
The preloader instead uses the Web Animations API so its initial render has no Framer Motion dependency.
Framer Motion remains confined to the navigation overlay, using strict LazyMotion, m elements and asynchronously loaded domAnimation features.

The two planes separate vertically from their horizontal seam after the existing s hold, over duration l.
The wordmark scales to 1.08 and fades over m; reduced motion replaces movement with opacity over l.
The seam retains its alternating xl pulse and xs exit. Timing and cubic Bézier values use the existing shared tokens.
The completion marker is published only after every exit animation finishes. Cleanup cancels animations.

Trade-offs: the implementation requires Web Animations support and two independent opacity/transform effects on the wordmark.
Visual equivalence, reduced-motion switching during exit, and the hero release boundary require browser verification.
