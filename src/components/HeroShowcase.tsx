"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HEROES, HERO_INTERVAL_MS, type HeroConfig } from "@/lib/hero-showcase";

/* ═══════════════════════════════════════════════════════════════
   HERO SHOWCASE
   One character at a time on the hero's extreme right. Each character
   radiates its own logo as a glowing aura DIRECTLY BEHIND it (character
   overlaps the logo), over a per-character background wash. Rotation
   lives in useHeroRotation; page.tsx consumes the active hero for
   accent propagation.

   Fits every viewport: the stage box is responsive and the character
   fills it (object-contain, bottom-right), so nothing overflows on
   tablet/desktop. Reduced motion collapses to a static Spider-Man.
   All motion is transform/opacity; wash + character carry will-change.
   ═══════════════════════════════════════════════════════════════ */

const EXIT_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

/** 6.5s rotation; paused while the tab is hidden, disabled on reduced motion. */
export function useHeroRotation(enabled: boolean): HeroConfig {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(() => setIndex((i) => (i + 1) % HEROES.length), HERO_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  return HEROES[enabled ? index : 0];
}

interface HeroShowcaseProps {
  hero: HeroConfig;
  /** true = static Spider-Man, no rotation visuals (reduced motion) */
  isStatic: boolean;
  /** gate the first entrance until the first-load screen has left */
  live: boolean;
}

export default function HeroShowcase({ hero, isStatic, live }: HeroShowcaseProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* Preload all 8 images once — transitions must never show an unloaded frame. */
  useEffect(() => {
    if (isStatic) return;
    HEROES.forEach((h) => {
      new window.Image().src = h.character;
      new window.Image().src = h.logo;
    });
  }, [isStatic]);

  const active = isStatic ? HEROES[0] : hero;
  const shown = live || isStatic;

  return (
    <>
      {/* ── Background theme wash — full-hero layer behind everything.
          Whole gradient layers crossfade via opacity; gradient values are
          never animated. Base #050508 stays at the edges (72% falloff). ── */}
      {mounted && !isStatic && (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <AnimatePresence>
            <motion.div
              key={active.id}
              className="absolute inset-0"
              style={{
                willChange: "opacity",
                background: `radial-gradient(ellipse 75% 85% at 76% 42%, ${active.theme.bgFrom} 0%, ${active.theme.bgTo} 72%)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: EXIT_EASE }}
            />
          </AnimatePresence>
        </div>
      )}

      {/* ── Stage — responsive box, extreme right, bottom-anchored.
          Character fills it and may bleed off the right edge by design. ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 z-[5] h-[56svh] w-[70vw] sm:w-[58vw] md:h-[82svh] md:w-[50vw] lg:w-[44vw] xl:w-[40vw]"
      >
        <AnimatePresence>
          <motion.div
            key={active.id}
            className="absolute inset-0"
            initial={{ opacity: 0, x: shown ? 60 : 0 }}
            animate={{
              opacity: shown ? 1 : 0,
              x: 0,
              transition: { type: "spring", stiffness: 90, damping: 18, delay: 0.15 },
            }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.45, ease: EXIT_EASE } }}
          >
            {/* Persistent accent aura (backmost) — a soft colored halo that
                reads even where the logo is occluded, pulsing up on arrival
                then holding. This is the "aura-farming" glow. */}
            <motion.div
              className="absolute inset-x-0 bottom-[6%] top-[12%] rounded-full blur-3xl"
              style={{
                background: `radial-gradient(ellipse at 58% 45%, ${active.theme.accent}55 0%, ${active.theme.accent}22 42%, transparent 72%)`,
                willChange: "opacity",
              }}
              initial={isStatic ? false : { opacity: 0 }}
              animate={{ opacity: isStatic ? 0.8 : [0, 1, 0.85] }}
              transition={{ duration: 0.9, times: [0, 0.4, 1], delay: 0.2 }}
            />

            {/* Aura logo — over the glow, behind the character, scaled 1.08→1. */}
            <motion.img
              src={active.logo}
              alt=""
              className="absolute left-1/2 top-[44%]"
              style={{
                width: `${active.logoScale * 100}%`,
                transform: `translate(calc(-50% + ${active.logoOffsetX}), calc(-50% + ${active.logoOffsetY}))`,
                opacity: active.logoOpacity,
                filter: `saturate(1.15) drop-shadow(0 0 34px ${active.theme.accent})`,
                willChange: "transform, opacity",
              }}
              initial={isStatic ? false : { scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.7, ease: EXIT_EASE }}
            />

            {/* Character — fills the stage, scaled/nudged per framing, on top */}
            <Image
              src={active.character}
              alt=""
              width={800}
              height={1200}
              priority={active.id === "spiderman"}
              sizes="(max-width: 767px) 70vw, 44vw"
              className="absolute inset-0 h-full w-full"
              style={{
                objectFit: "contain",
                objectPosition: "right bottom",
                transform: `translate(${active.charOffsetX}, ${active.charOffsetY}) scale(${active.charScale})`,
                transformOrigin: "right bottom",
                willChange: "transform",
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
