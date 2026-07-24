"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Menu,
  FileText,
  Info,
  Sparkles,
  Gamepad2,
  Package,
  List,
  ArrowUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import CaseOpening from "@/src/components/CaseOpening";
import DocumentModal from "@/src/components/modals/DocumentModal";
import HeroShowcase, { useHeroRotation } from "@/src/components/HeroShowcase";
import { GradientTracing } from "@/src/components/ui/gradient-tracing";
import { HEROES } from "@/lib/hero-showcase";
import { useScrollStore } from "@/src/contexts/ScrollStore";

/* ── First-load screen ────────────────────────────────────────────
   A gold lightning-bolt intro. Gates on real critical assets (entry
   image + fonts) with a ~2s floor so it plays fully, and a 4s cap that
   fails open so a hung asset can never trap the visitor. Plays on every
   full page load (see introPlayed below).                            */
type LoaderState = "pending" | "visible" | "leaving" | "done";
/* Module-level, so it resets on every full page load (new JS context) but
   survives client-side navigation. The gold-bolt intro therefore plays on
   each reload/direct visit, but not when navigating back to home in-app. */
let introPlayed = false;

/* Shared styling for the three action cards — one red-glow language across
   all of them (pulse staggered per-card via inline animationDelay). */
const CARD_CLASS =
  "relative overflow-hidden flex flex-col items-center justify-center gap-4 h-full cursor-pointer rounded-2xl bg-zinc-950/40 backdrop-blur-3xl border border-red-500/30 hover:border-red-500 hover:bg-zinc-900/60 shadow-[inset_0_0_20px_rgba(220,38,38,0.1)] p-10 transition-all duration-500 text-center glow-pulse focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70";
const CARD_ICON_CLASS =
  "relative z-10 h-16 w-16 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/40 text-red-400";

/* ─── Component ─── */
export default function Home() {
  const [gameOpen, setGameOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [cvOpen, setCvOpen] = useState(false);
  const [aiTeased, setAiTeased] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { openMenu } = useScrollStore();
  const router = useRouter();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /* ── First-load screen state. `introPlayed` resets each full page load, so
     the intro shows on every reload; SSR starts "pending" (renders no loader,
     so hydration output matches). ── */
  const [loaderState, setLoaderState] = useState<LoaderState>(() =>
    typeof window !== "undefined" && introPlayed ? "done" : "pending"
  );
  const heroLive = loaderState === "leaving" || loaderState === "done";

  // First visit: show the loader on the next frame after mount.
  useEffect(() => {
    if (loaderState !== "pending") return;
    const id = requestAnimationFrame(() => setLoaderState("visible"));
    return () => cancelAnimationFrame(id);
  }, [loaderState]);

  // Wait for the REAL critical set: entry image + fonts (4s fail-open cap).
  useEffect(() => {
    if (loaderState !== "visible") return;
    let cancelled = false;
    const img = new window.Image();
    const entryLoaded = new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = HEROES[0].character; // Spider-Man opens the showcase
    });
    const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
    // Floor the display time (~2s) so the lightning-bolt intro plays fully
    // instead of flashing by on cached loads. Reduced motion skips the floor.
    // The 4s cap still fails open so a hung asset can never trap the visitor.
    const minTime = reduceMotion
      ? Promise.resolve()
      : new Promise<void>((resolve) => setTimeout(resolve, 2000));
    const cap = new Promise<void>((resolve) => setTimeout(resolve, 4000));
    Promise.race([Promise.all([entryLoaded, fontsReady, minTime]), cap]).then(() => {
      if (cancelled) return;
      introPlayed = true;
      setLoaderState("leaving");
    });
    return () => {
      cancelled = true;
    };
  }, [loaderState, reduceMotion]);

  // Owns the leaving→done transition (a separate effect: the state change
  // re-runs the effect above, whose cleanup would cancel an inner timer).
  useEffect(() => {
    if (loaderState !== "leaving") return;
    const t = setTimeout(() => setLoaderState("done"), 320);
    return () => clearTimeout(t);
  }, [loaderState]);

  /* ── Idle prefetch once the hero is interactive: warm the /projects +
     /details route chunks AND the resume (doc metadata + the PDF bytes), so
     "View Resume" opens instantly. ── */
  useEffect(() => {
    if (loaderState !== "done") return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => {
      router.prefetch("/projects");
      router.prefetch("/details");
      // Warm the resume so the modal paints immediately on first click.
      fetch("/api/documents/resume").catch(() => {});
      fetch("/documents/resume.pdf").catch(() => {});
    });
    return () => cancelIdle(id as number);
  }, [loaderState, router]);

  /*
   * HERO SHOWCASE STATE — see lib/hero-showcase.ts
   * Four characters rotate on the right edge (10s each). Mobile and
   * reduced motion collapse to a static Spider-Man with the default
   * theme. The active hero's accent tints the location dot, the
   * Ask-AI border glow, and the primary button's hover glow.
   */
  // Mobile gets the full rotation too (owner request) — only reduced
  // motion collapses to the static Spider-Man.
  const showcaseStatic = !!reduceMotion;
  const activeHero = useHeroRotation(heroLive && !showcaseStatic);
  const accent = showcaseStatic ? HEROES[0].theme.accent : activeHero.theme.accent;

  /* ── Stagger entrance variants ── */
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  return (
    <>
      {/* ── First-load screen — dismisses the moment critical assets are ready ── */}
      {(loaderState === "visible" || loaderState === "leaving") && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-[#050508]"
          animate={{ opacity: loaderState === "leaving" ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Gold lightning-bolt intro — the only entry animation ── */}
          {reduceMotion ? (
            <Zap
              size={128}
              fill="#F1C40F"
              color="#F1C40F"
              strokeWidth={1.25}
              className="drop-shadow-[0_0_28px_rgba(241,196,15,0.5)]"
            />
          ) : (
            <div className="relative flex items-center justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-16 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(241,196,15,0.28), transparent 70%)" }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1.4 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <GradientTracing
                  width={200}
                  height={200}
                  strokeWidth={3}
                  baseColor="#F1C40F"
                  path="M100,0 L75,75 L125,75 L50,200 L100,100 L50,100 L100,0"
                  gradientColors={["#F1C40F", "#F1C40F", "#E67E22"]}
                  animationDuration={1.0}
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Game Feature Modal (non-blocking) ── */}
      <CaseOpening
        isOpen={gameOpen}
        onClose={() => setGameOpen(false)}
        onOpenDocument={(type) => (type === "resume" ? setResumeOpen(true) : setCvOpen(true))}
      />
      <DocumentModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} type="resume" />
      <DocumentModal isOpen={cvOpen} onClose={() => setCvOpen(false)} type="cv" />

      {/* ── Global scrollbar styles ── */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #000;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #333 #000;
        }
      `}</style>

      {/* ═══════════════════════════════════════════════ */}
      {/* SCROLL CONTAINER                               */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        ref={scrollContainerRef}
        id="portfolio-root"
        className="relative w-full flex flex-col items-center"
        style={{ background: "transparent" }}
      >
        {/* ═══════════════════════════════════════════════ */}
        {/* HERO SECTION                                   */}
        {/* ═══════════════════════════════════════════════ */}
        {/* Hero is the stage's positioned ancestor — exactly 100svh so the
            .spidey-stage bottom:35svh really lands his feet at 65svh. */}
        <section className="relative h-svh w-full flex items-center bg-transparent">

          {/* Mobile legibility scrim — sits above the character (z-5) and below
              the content (z-10). Left stays dark for the text, the right fades
              to transparent so the character still glows through. Desktop uses
              its two columns instead and hides this. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[6] bg-gradient-to-r from-[#050508] via-[#050508]/80 to-transparent md:hidden"
          />

          {/* ── MAIN GRID — single column below 768px, hero stacks ──
              relative z-10: must paint above the showcase's absolutely
              positioned bg-wash layer (z-0), or the left column text
              vanishes underneath the gradient. ── */}
          <div className="relative z-10 grid flex-1 grid-cols-1 md:grid-cols-2">
            {/* ─── LEFT COLUMN — Premium Content ─── */}
            {/* Mobile: content starts below the hanging entry Spider-Man
                (his bottom lands ≈36svh), so nothing runs under him. */}
            <motion.div
              className="flex flex-col justify-start gap-4 px-6 pt-[38svh] md:justify-center md:gap-6 md:px-16 md:pt-[72px] lg:px-24"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Name — Dominant anchor (DESIGN.md order: name, then location) */}
              {/* One line at every resolution — clamp scales with viewport */}
              <motion.h1
                id="hero-name"
                variants={itemVariants}
                className="whitespace-nowrap text-[clamp(2rem,7.2vw,7rem)] font-black leading-none tracking-tighter text-white"
                style={{
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                }}
              >
                SRINIVAS <span className="text-white/90">R C</span>
              </motion.h1>

              {/* Location — dot + text tint follow the active hero's accent */}
              <motion.p
                id="hero-location"
                variants={itemVariants}
                className="flex items-center gap-2.5 text-xs font-semibold uppercase"
                style={{
                  letterSpacing: "0.2em",
                  color: accent,
                  transition: "color 0.6s ease",
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background: accent,
                    boxShadow: `0 0 10px ${accent}b3`,
                    transition: "background 0.6s ease, box-shadow 0.6s ease",
                  }}
                />
                Location: Bengaluru, Karnataka
              </motion.p>

              <motion.p
                id="hero-info"
                variants={itemVariants}
                className="text-[15px] leading-[1.65] text-gray-300 md:max-w-md md:text-lg md:leading-[1.8]"
              >
                I build full-stack applications end to end — React, Next.js,
                and TypeScript up front, with Python, Prisma, and Postgres
                behind them. My focus is agentic AI: shipping real LLM pipelines
                like ArchAgent, a multi-stage Google Gemini system that turns a
                text brief into 3D renders and costed estimates. I care about
                systems that are fast, correct, and actually reach production —
                not demos.
              </motion.p>

              {/* Action Buttons — always side by side, equal width, every view */}
              <motion.div
                id="hero-actions"
                variants={itemVariants}
                className="flex w-full max-w-md gap-3"
              >
                {/* Primary — red accent glass */}
                <motion.button
                  id="btn-resume"
                  onClick={() => setResumeOpen(true)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600/10 px-4 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 ease-out hover:border-red-500/70 hover:bg-red-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                >
                  <FileText size={16} strokeWidth={1.5} className="text-red-400 transition-transform duration-300 group-hover:scale-110" />
                  <span>View Resume</span>
                </motion.button>
                {/* Secondary — neutral glass */}
                <Link href="/details" className="flex-1">
                  <motion.button
                    id="btn-details"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-xl transition-all duration-300 ease-out hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <Info size={16} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
                    <span>View Details</span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* AI Assistant — enterprise-style dark glass widget */}
              <motion.div variants={itemVariants} className="max-w-md">
                <motion.button
                  id="btn-ai"
                  onClick={() => setAiTeased(true)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/50 px-5 py-4 text-left backdrop-blur-xl transition-all duration-300 ease-out hover:border-red-500/40 hover:bg-zinc-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                >
                  {/* single sheen sweep on hover — transform-only, no infinite loop */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
                  />
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition-colors duration-300 group-hover:border-red-500/50">
                    <Sparkles size={20} strokeWidth={2} />
                  </span>
                  <span className="relative flex flex-1 flex-col">
                    <span className="text-sm font-bold uppercase tracking-wider text-white">ASK AI ABT ME</span>
                    <span className="text-xs font-medium text-white/50">
                      {aiTeased ? "Coming soon — training in progress" : "Srinivas' personalized AI assistant"}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="relative shrink-0 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-red-400"
                  />
                </motion.button>
              </motion.div>
            </motion.div>

            {/* ═══════════════════════════════════════════ */}
            {/* RIGHT COLUMN — reserved for the showcase    */}
            {/* The showcase itself anchors to the 100svh    */}
            {/* section (extreme right), not this column.    */}
            {/* ═══════════════════════════════════════════ */}
            <div aria-hidden className="hidden md:block" />
          </div>

          {/* ── HERO SHOWCASE — bg wash + logo watermark + character ── */}
          {/* (the "Hi, there!" cloud now lives with the footer Spidey) */}
          <HeroShowcase hero={activeHero} isStatic={showcaseStatic} live={heroLive} />

          {/* ── Scroll cue — anchors the lower hero + smooth-scrolls down ── */}
          {heroLive && (
            <motion.button
              type="button"
              aria-label="Scroll down"
              onClick={() =>
                document.getElementById("explore-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="group absolute bottom-8 left-6 z-10 flex items-center gap-3 md:left-16 lg:left-24"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              whileTap={{ scale: 0.92 }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/30 transition-colors duration-300 group-hover:text-white/60">
                Scroll
              </span>
              <span className="flex h-9 w-5 items-start justify-center rounded-full border border-white/15 p-1 transition-colors duration-300 group-hover:border-white/40">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-white/50"
                  animate={reduceMotion ? undefined : { y: [0, 12, 0], opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
            </motion.button>
          )}
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* ACTION SECTION                                 */}
        {/* ═══════════════════════════════════════════════ */}
        <section id="explore-section" className="relative min-h-screen w-full flex flex-col justify-center items-center py-24 bg-transparent z-20">
          {/* ── Sticky mini-header ── */}
          <div className="sticky top-[72px] z-30 mb-12 flex w-full items-center justify-between border-b border-white/5 bg-black/60 px-6 py-4 backdrop-blur-xl md:px-12">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-300">
              <span>SRINIVAS R C</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500">Bengaluru</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={openMenu}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={scrollToTop}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Scroll to top"
              >
                <ArrowUp size={18} />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl px-8">

            {/* All three share the red-glow treatment; the pulse is staggered
                (0/1/2s) so the row breathes instead of flashing in lockstep. */}

            {/* Card 1: Loot Vault (case opening) */}
            <motion.div
              role="button"
              tabIndex={0}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -10, boxShadow: "0 0 30px rgba(220,38,38,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGameOpen(true)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setGameOpen(true)}
              style={{ animationDelay: "0s" }}
              className={CARD_CLASS}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
              {/* Idle shine sweep — hints the chest is interactive */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "chestShine 7s ease-in-out infinite",
                }}
              />
              <div className={CARD_ICON_CLASS}>
                <Package size={32} strokeWidth={1.5} />
              </div>
              <h2 className="relative z-10 text-xl font-bold text-white tracking-widest uppercase">Loot Vault</h2>
              <p className="relative z-10 text-sm text-zinc-400">Crack the case to reveal my work</p>
            </motion.div>

            {/* Card 2: Master Record (all details) */}
            <Link href="/details" className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -10, boxShadow: "0 0 30px rgba(220,38,38,0.3)" }}
                whileTap={{ scale: 0.95 }}
                style={{ animationDelay: "1s" }}
                className={CARD_CLASS}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
                <div className={CARD_ICON_CLASS}>
                  <List size={32} strokeWidth={1.5} />
                </div>
                <h2 className="relative z-10 text-xl font-bold text-white tracking-widest uppercase">Master Record</h2>
                <p className="relative z-10 text-sm text-zinc-400">View all details</p>
              </motion.div>
            </Link>

            {/* Card 3: Interactive Mode (games) */}
            <Link href="/game" className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -10, boxShadow: "0 0 30px rgba(220,38,38,0.3)" }}
                whileTap={{ scale: 0.95 }}
                style={{ animationDelay: "2s" }}
                className={CARD_CLASS}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
                <div className={CARD_ICON_CLASS}>
                  <Gamepad2 size={32} strokeWidth={1.5} />
                </div>
                <h2 className="relative z-10 text-xl font-bold text-white tracking-widest uppercase">Interactive Mode</h2>
                <p className="relative z-10 text-sm text-zinc-400">Play my portfolio games</p>
              </motion.div>
            </Link>

          </div>
        </section>
      </div>
    </>
  );
}
