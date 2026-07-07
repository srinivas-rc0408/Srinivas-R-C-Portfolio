import type { Variants, Transition } from "framer-motion";

/* ---- ENTRY DROP (1.png) ---------------------------------------- */
/* Original spec was damping 8 → 4–5 oscillations, reads janky.
   damping 11 = two confident bounces, still playful.                */
export const entryDrop: Variants = {
  hidden:  { y: -600, opacity: 0 },
  visible: {
    y: 0, opacity: 1,
    transition: { type: "spring", mass: 1.5, stiffness: 50, damping: 11 },
  },
};

/* ---- CAROUSEL CROSSFADE (pull-focus) ---------------------------- */
/* Animates `filter` — the ONE scoped exception to the transform/opacity
   rule. blur() is GPU-composited in modern browsers. Never animate
   filter anywhere else in the app.                                   */
const focusEase: Transition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] };
export const crossfade: Variants = {
  enter:  { opacity: 0, scale: 0.94, filter: "blur(8px)" },
  center: { opacity: 1, scale: 1,    filter: "blur(0px)", transition: focusEase },
  exit:   { opacity: 0, scale: 1.06, filter: "blur(8px)", transition: focusEase },
};
/* Use <AnimatePresence mode="popLayout"> keyed by src.
   Preload the NEXT image 1.5s before each swap: new Image().src = next. */

/* ---- HAMMOCK SCROLL REVEAL (11.png) ----------------------------- */
/* The blur sharpen-in participates in the crossfade blur exception —
   ONLY during the reveal moment, never in the idle sway.             */
export const hammockReveal: Variants = {
  hidden:  { opacity: 0, y: 64, scaleY: 0.92, filter: "blur(6px)" },
  visible: {
    opacity: 1, y: 0, scaleY: 1, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 60, damping: 13, filter: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  },
};

/* After reveal completes, start the idle sway (skip if reduced motion): */
export const hammockSway = {
  y: [0, -5, 0],
  rotate: [0, 0.3, 0],
  transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const },
};
