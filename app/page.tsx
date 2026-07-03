"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Menu,
  User,
  FileText,
  Info,
  Sparkles,
  Gamepad2,
  Package,
  List,
} from "lucide-react";
import Link from "next/link";
import GameFeature from "./components/GameFeature";
import CaseOpening from "@/src/components/CaseOpening";

/* ─── Constants ─── */
const HANGING_POSES = new Set([1, 8]);
const HERO_IMAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14]; // excludes 11 (bg), 15 (removed), 17 (error)

/* ─── Helpers ─── */
function pickRandomHanging(): number {
  const arr = [1, 8];
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomImage(exclude: number): number {
  const candidates = HERO_IMAGES.filter((n) => n !== exclude);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/* ─── Component ─── */
export default function Home() {
  /*
   * TIERED STATE MACHINE
   * ─────────────────────
   * activeImage  — current displayed image (1–10)
   * dropKey      — increments to remount the spring container and replay drop
   * mounted      — client-only flag (avoids hydration mismatch)
   *
   * Tier 1 (Entrance):   Mount → random hanging pose, spring drop, web line
   * Tier 2 (Slideshow):  6s after any drop → cycle 1–10 every 5.5s
   * Tier 3 (Reset):      Every 60s → interrupt slideshow, force hanging drop
   */
  const [activeImage, setActiveImage] = useState(1);
  const [dropKey, setDropKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);

  const slideshowRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isHanging = HANGING_POSES.has(activeImage);

  /* ── Helper: clear the current slideshow interval ── */
  const clearSlideshow = useCallback(() => {
    if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
      slideshowRef.current = null;
    }
  }, []);

  /* ── TIER 1: Mount — pick a random hanging pose ── */
  useEffect(() => {
    setActiveImage(pickRandomHanging());
    setMounted(true);
  }, []);

  /* ── TIER 2: Slideshow — starts 6s after each drop ── */
  useEffect(() => {
    if (!mounted) return;

    const startDelay = setTimeout(() => {
      /* Kick off with an immediate swap */
      setActiveImage((prev) => getRandomImage(prev));

      slideshowRef.current = setInterval(() => {
        setActiveImage((prev) => getRandomImage(prev));
      }, 5500);
    }, 6000);

    return () => {
      clearTimeout(startDelay);
      clearSlideshow();
    };
  }, [mounted, dropKey, clearSlideshow]);

  /* ── TIER 3: 60-second reset — force a hanging drop ── */
  useEffect(() => {
    if (!mounted) return;

    const resetInterval = setInterval(() => {
      /* Interrupt the current slideshow */
      clearSlideshow();

      /* Force a new hanging pose and re-trigger the spring drop */
      setActiveImage(pickRandomHanging());
      setDropKey((prev) => prev + 1);
    }, 60_000);

    return () => clearInterval(resetInterval);
  }, [mounted, clearSlideshow]);

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
      {/* <GameFeature isOpen={gameOpen} onClose={() => setGameOpen(false)} /> */}
      <CaseOpening isOpen={gameOpen} onClose={() => setGameOpen(false)} />

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
            {/* RIGHT COLUMN — Tiered Spider-Man Physics   */}
            {/* ═══════════════════════════════════════════ */}
            <div className="relative flex h-full w-full items-center justify-center">
              {/*
               * dropKey as the key: when Tier 3 fires, dropKey increments,
               * React unmounts + remounts this container, and the spring
               * initial → animate replays the heavy drop from -100vh.
               */}
              <motion.div
                key={dropKey}
                id="character-container"
                className="relative flex h-full w-full items-center justify-center"
                initial={{ y: "-100vh" }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  mass: 1.5,
                  stiffness: 45,
                  damping: 12,
                }}
              >
                {/*
                 * SHARED CONTAINER: Groups web line + image so they
                 * stay locked together for perfect alignment on all
                 * hanging poses (1, 4, 8).
                 */}
                <div className="relative flex h-full w-full flex-col items-center justify-center">
                  {/* THE WEB LINE — z-0, h-[50%], top-0, only for hanging poses */}
                  <AnimatePresence>
                    {[1, 8].includes(activeImage) && (
                      <motion.div
                        id="web-string"
                        key="web-line"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.8 } }}
                        transition={{ duration: 0.6 }}
                        className="absolute left-1/2 top-0 z-0 -translate-x-1/2"
                        style={{
                          height: "50%",
                          width: "3px",
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0.95) 70%, rgba(255,255,255,0.6) 100%)",
                          boxShadow:
                            "0 0 15px rgba(255,255,255,1), 0 0 30px rgba(255,255,255,0.3)",
                          borderRadius: "2px",
                          transformOrigin: "top center",
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* THE IMAGE — z-10, -mt-10 so character's hands meet the web line */}
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={activeImage}
                      className="relative z-10 -mt-10 flex items-center justify-center"
                      initial={{
                        opacity: 0,
                        filter: "blur(12px)",
                        scale: 0.93,
                        x: 40,
                      }}
                      animate={{
                        opacity: 1,
                        filter: "blur(0px)",
                        scale: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        filter: "blur(12px)",
                        scale: 1.06,
                        x: -40,
                      }}
                      transition={{
                        duration: 1.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      <Image
                        src={`/${activeImage}.png`}
                        alt={`Srinivas R C — pose ${activeImage}`}
                        width={500}
                        height={600}
                        className={`pointer-events-none w-full select-none object-contain ${
                          activeImage === 17 ? "h-[50vh]" : "h-[80vh]"
                        }`}
                        style={{
                          filter: "drop-shadow(0 8px 50px rgba(140,0,0,0.35))",
                          objectPosition:
                            activeImage === 8
                              ? "75% center"    /* shift 8.png ~1cm to the right */
                              : activeImage === 17
                                ? "center 60%"   /* position 17.png nicely */
                                : "center center",
                        }}
                        unoptimized
                        loading="eager"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* ACTION SECTION                                 */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="relative min-h-screen w-full flex flex-col justify-center items-center py-24 bg-transparent z-20">
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
              className="flex flex-col items-center justify-center gap-4 cursor-pointer rounded-2xl bg-zinc-950/40 backdrop-blur-3xl border border-white/5 hover:border-red-500/50 hover:bg-zinc-900/60 p-10 transition-all duration-500 text-center"
            >
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
