"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HEROES, HERO_INTERVAL_MS, type HeroConfig } from "@/lib/hero-showcase";

/* ═══════════════════════════════════════════════════════════════
   HERO SHOWCASE
   One character at a time on the hero's extreme right, logo
   watermark behind it, page background wash keyed to the character.
   Rotation lives in useHeroRotation (page.tsx consumes the active
   hero for accent propagation). All motion is transform/opacity;
   the wash layers and the character carry will-change.

   Hydration rule: `initial` props never branch on client-divergent
   values (isStatic, live) — the server always renders the hidden
   state and `animate` decides the visible one. Client-only layers
   (bg wash, rim pulse) are mount-gated instead.

   Mobile (<768px) and reduced motion render Spider-Man static with
   the site-default theme — no rotation, no washes.
   ═══════════════════════════════════════════════════════════════ */

const EXIT_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

/** 10s rotation; paused while the tab is hidden, disabled on mobile/reduced motion. */
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
  /** true = static Spider-Man, no rotation visuals (mobile / reduced motion) */
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
  const shown = live || isStatic; // static mode has no loader gate to wait for

  return (
    <>
      {/* ── Background theme wash — full-hero layer behind everything.
          Whole gradient layers crossfade via opacity; gradient values are
          never animated. Base #050508 stays at the edges (72% falloff).
          Mount-gated: server markup never includes it, so no hydration
          branch; static mode (mobile/reduced motion) never shows it. ── */}
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

      {/* ── Stage — fixed dimensions (zero layout shift), extreme right,
          bottom-anchored. Characters may bleed off the right edge by design. ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 z-[5] h-[52svh] w-[clamp(150px,40vw,240px)] md:h-[78svh] md:w-[min(44vw,700px)]"
      >
        {/* Logo watermark — ambient environment behind the character.
            Desktop only: on the static mobile layout it would sit behind
            the text column and muddy it. The keyed presence child animates
            opacity ONLY, so the static placement transform on its style is
            never overwritten. */}
        <AnimatePresence>
          <motion.div
            key={`logo-${active.id}`}
            className="absolute hidden md:block"
            style={{
              right: 0,
              top: "50%",
              width: active.logoStyle.width,
              willChange: "opacity",
              transform: `translate(${active.logoStyle.offsetX}, calc(-50% + ${active.logoStyle.offsetY}))`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: shown ? active.logoStyle.opacity : 0 }}
            exit={{ opacity: 0, transition: { duration: 0.45, ease: EXIT_EASE } }}
            transition={{ duration: 0.7, ease: EXIT_EASE }}
          >
            <motion.img
              src={active.logo}
              alt=""
              className="h-auto w-full"
              style={{ filter: "saturate(0.65)", willChange: "transform" }}
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.7, ease: EXIT_EASE }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Character — outgoing slides 40px right + fades (0.45s), incoming
            slides in from 60px on a spring, 0.15s after the exit starts. */}
        <AnimatePresence>
          <motion.div
            key={`char-${active.id}`}
            className="absolute bottom-0 right-0 h-full"
            style={{ width: active.stage.width, willChange: "transform, opacity" }}
            initial={{ opacity: 0, x: 60 }}
            animate={{
              opacity: shown ? 1 : 0,
              x: shown ? 0 : 60,
              transition: { type: "spring", stiffness: 90, damping: 18, delay: 0.15 },
            }}
            exit={{
              opacity: 0,
              x: 40,
              transition: { duration: 0.45, ease: EXIT_EASE },
            }}
          >
            {/* accent rim-glow pulse on arrival (opacity-only flash) */}
            {mounted && !isStatic && (
              <motion.div
                aria-hidden
                className="absolute inset-x-0 bottom-0 top-1/4 rounded-full blur-3xl"
                style={{
                  background: `radial-gradient(ellipse at center, ${active.theme.accent}33 0%, transparent 70%)`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0.35] }}
                transition={{ duration: 0.9, times: [0, 0.4, 1], delay: 0.25 }}
              />
            )}
            <Image
              src={active.character}
              alt=""
              width={800}
              height={1200}
              priority={active.id === "spiderman"}
              sizes="(max-width: 767px) 46vw, 40vw"
              className="absolute bottom-0 right-0 h-full w-full"
              style={{
                objectFit: "contain",
                objectPosition: active.stage.align === "bottom" ? "right bottom" : "right center",
                transform: `translate(${active.stage.offsetX}, ${active.stage.offsetY})`,
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
