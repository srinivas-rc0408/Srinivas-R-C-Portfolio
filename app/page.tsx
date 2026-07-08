"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu,
  FileText,
  Info,
  Sparkles,
  Gamepad2,
  Package,
  List,
  ArrowUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import CaseOpening from "@/src/components/CaseOpening";
import DocumentModal from "@/src/components/modals/DocumentModal";
import { ENTRY, CAROUSEL, HAMMOCK, CAROUSEL_INTERVAL_MS, type SpideyAsset } from "@/lib/spiderman-assets";
import { entryDrop, crossfade, hammockReveal, hammockSway } from "@/lib/spiderman-motion";
import { useScrollStore } from "@/src/contexts/ScrollStore";

/* ── Mobile breakpoint — carousel disabled entirely below 768px ── */
const MOBILE_QUERY = "(max-width: 767px)";
function subscribeIsMobile(callback: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getIsMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}
function getIsMobileServerSnapshot() {
  return false;
}

/* ── First-load screen ────────────────────────────────────────────
   Gates ONLY on real critical assets: 1.png + fonts. No artificial
   minimum beyond the 300ms dismiss fade; a 4s cap fails open so a
   hung asset can never trap the visitor. Repeat visits skip it
   entirely via sessionStorage.                                     */
const LOADER_MESSAGES = ["Spinning up the web…", "Anchoring web lines…", "Suiting up…"];
type LoaderState = "pending" | "visible" | "leaving" | "done";

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

  /* ── First-load screen state. Repeat visits (sessionStorage) start at
     "done" and never see the loader; SSR starts "pending" (renders no
     loader either, so hydration output matches). ── */
  const [loaderState, setLoaderState] = useState<LoaderState>(() =>
    typeof window !== "undefined" && sessionStorage.getItem("first-load-done") ? "done" : "pending"
  );
  const [msgIndex, setMsgIndex] = useState(0);
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
      img.src = ENTRY.src;
    });
    const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
    const cap = new Promise<void>((resolve) => setTimeout(resolve, 4000));
    Promise.race([Promise.all([entryLoaded, fontsReady]), cap]).then(() => {
      if (cancelled) return;
      sessionStorage.setItem("first-load-done", "1");
      setLoaderState("leaving");
    });
    return () => {
      cancelled = true;
    };
  }, [loaderState]);

  // Owns the leaving→done transition (a separate effect: the state change
  // re-runs the effect above, whose cleanup would cancel an inner timer).
  useEffect(() => {
    if (loaderState !== "leaving") return;
    const t = setTimeout(() => setLoaderState("done"), 320);
    return () => clearTimeout(t);
  }, [loaderState]);

  // Rotating message while visible.
  useEffect(() => {
    if (loaderState !== "visible") return;
    const t = setInterval(() => setMsgIndex((i) => i + 1), 1100);
    return () => clearInterval(t);
  }, [loaderState]);

  /* ── Idle prefetch once the hero is interactive: warm all carousel
     images and the /projects + /details route chunks. ── */
  useEffect(() => {
    if (loaderState !== "done") return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => {
      CAROUSEL.forEach((a) => {
        new window.Image().src = a.src;
      });
      router.prefetch("/projects");
      router.prefetch("/details");
    });
    return () => cancelIdle(id as number);
  }, [loaderState, router]);

  /*
   * SPIDER-MAN HERO STATE — see SPIDERMAN-ASSETS-SPEC.md
   * 1.png is the locked entry pose (drops once on load). After it settles,
   * the carousel takes over, cycling CAROUSEL forever — no forced reset.
   * The starting index is shuffled once per mount so repeat visits vary,
   * but the style-grouped sequence itself never reorders.
   */
  const isMobile = useSyncExternalStore(subscribeIsMobile, getIsMobileSnapshot, getIsMobileServerSnapshot);
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselStep, setCarouselStep] = useState(0);
  const [startOffset] = useState(() => Math.floor(Math.random() * CAROUSEL.length));
  const [landed, setLanded] = useState(false);
  /* Reduced motion renders the entry already settled — glow shows immediately. */
  const showGlow = landed || !!reduceMotion;

  /* ── "Hi, there" thought cloud: pops in once Spidey settles, then fades ── */
  const [hiThere, setHiThere] = useState(false);
  useEffect(() => {
    if (!showGlow) return;
    const show = setTimeout(() => setHiThere(true), 350);
    const hide = setTimeout(() => setHiThere(false), 5600);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [showGlow]);

  const activeAsset: SpideyAsset =
    !showCarousel || isMobile ? ENTRY : CAROUSEL[(startOffset + carouselStep) % CAROUSEL.length];


  /* ── Start the carousel once the entry drop has settled.
     Reduced motion = render final state, no loops (DESIGN.md) —
     the entry pose stays, the carousel never starts. ── */
  useEffect(() => {
    if (isMobile || reduceMotion || !heroLive) return;
    const startDelay = setTimeout(() => setShowCarousel(true), 6000);
    return () => clearTimeout(startDelay);
  }, [isMobile, reduceMotion, heroLive]);

  /* ── Carousel tick ── */
  useEffect(() => {
    if (!showCarousel || isMobile) return;
    const interval = setInterval(() => {
      setCarouselStep((s) => s + 1);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [showCarousel, isMobile]);

  /* ── Preload the next carousel image 1.5s before each swap ── */
  useEffect(() => {
    if (!showCarousel || isMobile) return;
    const next = CAROUSEL[(startOffset + carouselStep + 1) % CAROUSEL.length];
    const timer = setTimeout(() => {
      new window.Image().src = next.src;
    }, CAROUSEL_INTERVAL_MS - 1500);
    return () => clearTimeout(timer);
  }, [showCarousel, isMobile, carouselStep, startOffset]);

  /* ── Hammock: reveal once on scroll, then sway forever (unless reduced motion) ── */
  const [hammockSwaying, setHammockSwaying] = useState(false);

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
          className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050508]"
          animate={{ opacity: loaderState === "leaving" ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Web line draws down from the ceiling to the logo (transform-only) */}
          <motion.div
            className="absolute left-1/2 top-0 w-[1.5px] -translate-x-1/2"
            style={{
              height: "calc(50% - 56px)",
              transformOrigin: "top",
              background: "linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0.4))",
            }}
            initial={reduceMotion ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Lightning-S — same composition as the navbar trigger */}
          <motion.div
            className="relative flex items-center justify-center text-red-500"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Zap size={44} className="absolute -left-5 text-yellow-500 opacity-80" />
            <span className="text-6xl font-black italic tracking-tighter">S</span>
          </motion.div>
          <motion.p
            key={msgIndex}
            className="mt-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {LOADER_MESSAGES[msgIndex % LOADER_MESSAGES.length]}
          </motion.p>
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

          {/* ── MAIN GRID — single column below 768px, hero stacks ── */}
          <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
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

              {/* Location */}
              <motion.p
                id="hero-location"
                variants={itemVariants}
                className="flex items-center gap-2.5 text-xs font-semibold uppercase text-red-500"
                style={{ letterSpacing: "0.2em" }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full bg-red-500"
                  style={{ boxShadow: "0 0 10px rgba(220,38,38,0.7)" }}
                />
                Location: Bengaluru, Karnataka
              </motion.p>

              <motion.p
                id="hero-info"
                variants={itemVariants}
                className="text-[15px] leading-[1.65] text-gray-300 md:max-w-md md:text-lg md:leading-[1.8]"
              >
                Aspiring AI Engineer building highly optimized agentic systems
                and full-stack applications. Passionate about pushing the
                boundaries of what&apos;s possible with modern AI and software
                engineering.
              </motion.p>

              {/* Action Buttons — Sharp rectangles */}
              <motion.div
                id="hero-actions"
                variants={itemVariants}
                className="flex flex-wrap gap-4"
              >
                {/* Primary — red accent glass */}
                <motion.button
                  id="btn-resume"
                  onClick={() => setResumeOpen(true)}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl border border-red-500/40 bg-red-600/15 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition-colors duration-300 hover:border-red-500/70 hover:bg-red-600/25 md:px-10 md:py-4"
                >
                  {/* glow layer — opacity-only, never animated box-shadow */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ boxShadow: "0 0 24px rgba(220,38,38,0.45), inset 0 0 12px rgba(220,38,38,0.15)" }}
                  />
                  <FileText size={16} strokeWidth={1.5} className="relative z-10 text-red-400" />
                  <span className="relative z-10">View Resume</span>
                </motion.button>
                {/* Secondary — neutral glass */}
                <Link href="/details">
                  <motion.button
                    id="btn-details"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-xl transition-colors duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white md:px-10 md:py-4"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ boxShadow: "0 0 20px rgba(255,255,255,0.12)" }}
                    />
                    <Info size={16} strokeWidth={1.5} className="relative z-10" />
                    <span className="relative z-10">View Details</span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* AI Assistant Button — Full-width rectangle */}
              <motion.div variants={itemVariants} className="max-w-md">
                <motion.button
                  id="btn-ai"
                  onClick={() => setAiTeased(true)}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(220,38,38,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="glow-pulse relative flex w-full cursor-pointer flex-col items-start gap-1 overflow-hidden border border-red-500/30 px-8 py-5 transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(127,29,29,0.15) 50%, rgba(220,38,38,0.08) 100%)",
                    boxShadow: "0 0 10px rgba(220,38,38,0.3)",
                  }}
                >
                  {/* Shimmer overlay */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 3s ease-in-out infinite",
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2.5 text-xl font-bold text-white">
                    <Sparkles size={20} strokeWidth={2} className="text-red-400" />
                    ASK AI ABT ME
                  </span>
                  <span className="relative z-10 text-xs font-medium text-white/50">
                    {aiTeased ? "Coming soon — training in progress" : "Srinivas' personalized AI assistant"}
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* ═══════════════════════════════════════════ */}
            {/* RIGHT COLUMN — Spider-Man Stage             */}
            {/* See SPIDERMAN-ASSETS-SPEC.md for every number below.
                No `relative` here: .spidey-stage must anchor to the
                100svh section, not this column.              */}
            {/* ═══════════════════════════════════════════ */}
            <div className="flex h-full w-full items-center justify-center">
              <motion.div
                className="spidey-stage"
                data-anchor={activeAsset.anchor}
                initial={reduceMotion ? false : "hidden"}
                animate={reduceMotion || heroLive ? "visible" : "hidden"}
                variants={entryDrop}
                onAnimationComplete={(def) => def === "visible" && setLanded(true)}
              >
                {/* initial={false}: the entry pose gets ONLY the spring drop,
                    never the crossfade blur-in on first paint. */}
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={activeAsset.src}
                    className={`relative flex h-full max-w-full justify-center ${
                      activeAsset.anchor === "top-web" ? "items-start" : "items-end"
                    }`}
                    variants={crossfade}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={reduceMotion ? { duration: 0 } : undefined}
                  >
                    {activeAsset.anchor === "top-web" && (
                      <div
                        className="web-line"
                        style={{ "--web-x": activeAsset.webX } as React.CSSProperties}
                      />
                    )}
                    <Image
                      src={activeAsset.src}
                      alt="Spider-Man"
                      width={activeAsset.w}
                      height={activeAsset.h}
                      priority={activeAsset.src === ENTRY.src}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* "Hi, there" thought cloud — white bubble + trailing dots,
                    pops in after Spidey settles, drifts out on its own. */}
                <AnimatePresence>
                  {hiThere && (
                    <motion.div
                      aria-hidden
                      className="absolute -top-2 left-0 z-20 -translate-x-1/3 md:-left-10 md:top-4 md:translate-x-0"
                      style={{ transformOrigin: "bottom right" }}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -6 }}
                      transition={{ type: "spring", stiffness: 280, damping: 18 }}
                    >
                      <div className="relative rounded-2xl bg-white px-4 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.45)]">
                        <span
                          className="whitespace-nowrap text-sm font-bold text-zinc-900"
                          style={{ fontFamily: "'Comic Sans MS', 'Segoe UI', sans-serif" }}
                        >
                          Hi, there!
                        </span>
                        {/* thought-cloud trail toward Spidey */}
                        <div className="absolute -bottom-2.5 right-2 h-2.5 w-2.5 rounded-full bg-white" />
                        <div className="absolute -bottom-5 right-0 h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Soft landing glow — fades in once the drop settles.
                    Opacity/transform only; the blur is static, not animated. */}
                {/* hidden on mobile: the short entry image hangs from the stage
                    top there, so a stage-bottom glow would float detached */}
                <motion.div
                  aria-hidden
                  className="absolute -bottom-7 left-1/2 hidden h-10 w-3/5 -translate-x-1/2 rounded-full blur-2xl md:block"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(220,38,38,0.45) 0%, rgba(220,38,38,0.12) 55%, transparent 80%)",
                  }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={showGlow ? { opacity: 1, scale: 1 } : undefined}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* ACTION SECTION                                 */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="relative min-h-screen w-full flex flex-col justify-center items-center py-24 bg-transparent z-20">
          {/* Hammock — full-bleed scroll reveal, top of this section. Not a background image. */}
          <motion.div
            className="relative w-full overflow-hidden"
            style={{ width: "100vw", transformOrigin: "top center" }}
            initial={reduceMotion ? false : "hidden"}
            whileInView={reduceMotion ? undefined : "visible"}
            animate={reduceMotion ? "visible" : hammockSwaying ? hammockSway : undefined}
            viewport={{ once: true, amount: 0.35 }}
            variants={hammockReveal}
            onAnimationComplete={() => {
              if (!reduceMotion) setHammockSwaying(true);
            }}
          >
            {/* Capped at 1200px from the 2000px-wide @2x source — always
                downscaled, never stretched. quality 100 keeps the optimizer
                from softening it. */}
            <Image
              src={HAMMOCK.src}
              width={HAMMOCK.w}
              height={HAMMOCK.h}
              sizes="(min-width: 1200px) 1200px, 100vw"
              quality={100}
              className="mx-auto w-full max-w-[1200px]"
              style={{ height: "auto" }}
              alt=""
            />
            {/* On wide screens the web strands continue to the viewport edges,
                so the hammock still reads as strung across the whole screen.
                Anchor rows measured from 11.png alpha: left 31%, right 10%. */}
            <div
              aria-hidden
              className="absolute left-0 top-[31%] h-px"
              style={{
                width: "max(0px, calc((100% - 1200px) / 2))",
                background:
                  "linear-gradient(to right, transparent, rgba(255,255,255,0.35))",
              }}
            />
            <div
              aria-hidden
              className="absolute right-0 top-[10%] h-px"
              style={{
                width: "max(0px, calc((100% - 1200px) / 2))",
                background:
                  "linear-gradient(to left, transparent, rgba(255,255,255,0.35))",
              }}
            />
          </motion.div>

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

            {/* Card 1: The Game / Chest */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGameOpen(true)}
              className="relative flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden rounded-2xl bg-zinc-950/40 backdrop-blur-3xl border border-white/5 hover:border-red-500/50 hover:bg-zinc-900/60 p-10 transition-all duration-500 text-center"
            >
              {/* Idle shine sweep — hints the card is interactive */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "chestShine 7s ease-in-out infinite",
                }}
              />
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                <Package size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">System Vault</h2>
              <p className="text-sm text-zinc-400">Open chest to see my details</p>
            </motion.div>

            {/* Card 2: The Details */}
            <Link href="/details" className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center gap-4 cursor-pointer rounded-2xl bg-zinc-950/40 backdrop-blur-3xl border border-white/5 hover:border-red-500/50 hover:bg-zinc-900/60 p-10 transition-all duration-500 text-center h-full"
              >
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white">
                  <List size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-white tracking-widest uppercase">Master Record</h2>
                <p className="text-sm text-zinc-400">View All Details</p>
              </motion.div>
            </Link>

            {/* Card 3: Phaser Game */}
            <Link href="/game" className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -10, boxShadow: "0 0 30px rgba(220,38,38,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden flex flex-col items-center justify-center gap-4 cursor-pointer rounded-2xl bg-zinc-950/40 backdrop-blur-3xl border border-red-500/30 hover:border-red-500 hover:bg-zinc-900/60 shadow-[inset_0_0_20px_rgba(220,38,38,0.1)] p-10 transition-all duration-500 text-center h-full glow-pulse"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/40 text-red-400 relative z-10">
                  <Gamepad2 size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-white tracking-widest uppercase relative z-10">Interactive Mode</h2>
                <p className="text-sm text-zinc-400 relative z-10">Play my portfolio game</p>
              </motion.div>
            </Link>

          </div>
        </section>
      </div>
    </>
  );
}
