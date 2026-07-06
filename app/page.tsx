"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
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

/* ─── Component ─── */
export default function Home() {
  const [gameOpen, setGameOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [cvOpen, setCvOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { openMenu } = useScrollStore();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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

  const activeAsset: SpideyAsset =
    !showCarousel || isMobile ? ENTRY : CAROUSEL[(startOffset + carouselStep) % CAROUSEL.length];


  /* ── Start the carousel once the entry drop has settled ── */
  useEffect(() => {
    if (isMobile) return;
    const startDelay = setTimeout(() => setShowCarousel(true), 6000);
    return () => clearTimeout(startDelay);
  }, [isMobile]);

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
        <section className="relative min-h-screen w-full flex items-center bg-transparent">

          {/* ── MAIN GRID ── */}
          <div className="grid flex-1 grid-cols-2">
            {/* ─── LEFT COLUMN — Premium Content ─── */}
            <motion.div
              className="flex flex-col justify-center gap-8 px-10 md:px-16 lg:px-24"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
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

              {/* Name — Dominant anchor */}
              <motion.h1
                id="hero-name"
                variants={itemVariants}
                className="text-8xl font-black leading-none tracking-tighter text-white xl:text-9xl"
                style={{
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                }}
              >
                SRINIVAS.
                <br />
                <span className="text-white/90">R. C</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                id="hero-info"
                variants={itemVariants}
                className="max-w-md text-lg leading-[1.8] text-gray-300"
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
                <motion.button
                  id="btn-resume"
                  onClick={() => setResumeOpen(true)}
                  whileHover={{
                    scale: 1.03,
                    borderColor: "rgba(255,255,255,0.6)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="flex cursor-pointer items-center gap-2.5 border border-white/20 bg-transparent px-10 py-4 text-sm font-medium text-white/80 transition-all duration-300 hover:text-white"
                >
                  <FileText size={16} strokeWidth={1.5} />
                  View Resume
                </motion.button>
                <motion.button
                  id="btn-details"
                  whileHover={{
                    scale: 1.03,
                    borderColor: "rgba(255,255,255,0.6)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="flex cursor-pointer items-center gap-2.5 border border-white/20 bg-transparent px-10 py-4 text-sm font-medium text-white/80 transition-all duration-300 hover:text-white"
                >
                  <Info size={16} strokeWidth={1.5} />
                  View Details
                </motion.button>
              </motion.div>

              {/* AI Assistant Button — Full-width rectangle */}
              <motion.div variants={itemVariants} className="max-w-md">
                <motion.button
                  id="btn-ai"
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(220,38,38,0.5)" }}
                  whileTap={{ scale: 0.98 }}
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
                    Srinivas&apos; personalized AI assistant
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* ═══════════════════════════════════════════ */}
            {/* RIGHT COLUMN — Spider-Man Stage             */}
            {/* See SPIDERMAN-ASSETS-SPEC.md for every number below. */}
            {/* ═══════════════════════════════════════════ */}
            <div className="relative flex h-full w-full items-center justify-center">
              <motion.div
                className="spidey-stage"
                data-anchor={activeAsset.anchor}
                initial={reduceMotion ? false : "hidden"}
                animate="visible"
                variants={entryDrop}
              >
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeAsset.src}
                    className="relative"
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
            className="w-full"
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
            <Image
              src={HAMMOCK.src}
              width={HAMMOCK.w}
              height={HAMMOCK.h}
              sizes="100vw"
              style={{ width: "100%", height: "auto" }}
              alt=""
            />
          </motion.div>

          {/* ── Sticky mini-header ── */}
          <div className="sticky top-0 z-30 mb-12 flex w-full items-center justify-between border-b border-white/5 bg-black/60 px-6 py-4 backdrop-blur-xl md:px-12">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-300">
              <span>SRINIVAS R.C</span>
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
              <h3 className="text-xl font-bold text-white tracking-widest uppercase">System Vault</h3>
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
                <h3 className="text-xl font-bold text-white tracking-widest uppercase">Master Record</h3>
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
                <h3 className="text-xl font-bold text-white tracking-widest uppercase relative z-10">Interactive Mode</h3>
                <p className="text-sm text-zinc-400 relative z-10">Play my portfolio game</p>
              </motion.div>
            </Link>

          </div>
        </section>
      </div>
    </>
  );
}
