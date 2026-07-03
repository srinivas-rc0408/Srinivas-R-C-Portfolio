"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  FileText,
  Code,
  Cpu,
  Briefcase,
  GraduationCap,
  Mail,
  Award,
  Rocket,
  Shield,
  Star,
  Zap,
  Trophy,
  Gem,
} from "lucide-react";

/* ─── Roulette Items ─── */
interface RouletteItem {
  icon: React.ElementType;
  label: string;
  color: string;
  isWinner?: boolean;
}

const WINNER_ITEM: RouletteItem = {
  icon: Rocket,
  label: "Portfolio Access",
  color: "#ef4444",
  isWinner: true,
};

const FILLER_ITEMS: RouletteItem[] = [
  { icon: FileText, label: "Resume", color: "#3b82f6" },
  { icon: Code, label: "Projects", color: "#22c55e" },
  { icon: Cpu, label: "AI Assistant", color: "#a855f7" },
  { icon: Briefcase, label: "Experience", color: "#f59e0b" },
  { icon: GraduationCap, label: "Education", color: "#06b6d4" },
  { icon: Mail, label: "Contact", color: "#ec4899" },
  { icon: Award, label: "Certificates", color: "#f97316" },
  { icon: Shield, label: "Skills", color: "#14b8a6" },
  { icon: Star, label: "Highlights", color: "#eab308" },
  { icon: Zap, label: "Quick Links", color: "#8b5cf6" },
  { icon: Trophy, label: "Achievements", color: "#d97706" },
  { icon: Gem, label: "Rare Item", color: "#6366f1" },
];

/* Build a long strip of items with the winner placed at a known index */
function buildStrip(totalSlots: number, winnerIndex: number): RouletteItem[] {
  const strip: RouletteItem[] = [];
  for (let i = 0; i < totalSlots; i++) {
    if (i === winnerIndex) {
      strip.push(WINNER_ITEM);
    } else {
      strip.push(FILLER_ITEMS[i % FILLER_ITEMS.length]);
    }
  }
  return strip;
}

const TOTAL_SLOTS = 60;
const WINNER_INDEX = 53; // lands near the end for a long satisfying spin
const ITEM_WIDTH = 120; // px per slot
const STRIP = buildStrip(TOTAL_SLOTS, WINNER_INDEX);

/* ─── Phases ─── */
type Phase = "crate" | "spinning" | "result";

/* ─── Component ─── */
export default function GamifiedOverlay() {
  const [phase, setPhase] = useState<Phase>("crate");
  const [visible, setVisible] = useState(true);
  const [flashActive, setFlashActive] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  /* ── Simple click sound using Web Audio API ── */
  const playTickSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800 + Math.random() * 400;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      /* silent fallback */
    }
  }, []);

  /* ── Spin handler ── */
  const handleCrateClick = useCallback(() => {
    setPhase("spinning");

    /* Calculate final translateX to center winner under the target line */
    const targetOffset =
      WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2; // center of winner slot
    /* We need to shift so that target is at 50% of the viewport-width window */

    if (stripRef.current) {
      const container = stripRef.current.parentElement;
      const containerWidth = container?.clientWidth ?? 600;
      const finalX = -(targetOffset - containerWidth / 2);

      /* Apply the animation via CSS transition for the heavy power4.out feel */
      stripRef.current.style.transition = "none";
      stripRef.current.style.transform = "translateX(200px)";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (stripRef.current) {
            stripRef.current.style.transition =
              "transform 4.5s cubic-bezier(0.05, 0.85, 0.12, 1)";
            stripRef.current.style.transform = `translateX(${finalX}px)`;
          }
        });
      });
    }

    /* Tick sounds during spin */
    const tickInterval = setInterval(() => playTickSound(), 80);
    setTimeout(() => clearInterval(tickInterval), 3500);

    /* After spin completes → show result */
    setTimeout(() => {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 400);
      setPhase("result");
    }, 4800);
  }, [playTickSound]);

  /* ── Exit handler ── */
  const handleExit = useCallback(() => {
    setVisible(false);
  }, []);

  /* ── Particle system for result phase ── */
  const particles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 2 + 1.5,
      delay: Math.random() * 0.8,
    }))
  );

  /* ── Prevent body scroll while overlay is visible ── */
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="gamified-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* ── Glassmorphic backdrop ── */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(60,0,0,0.4) 0%, rgba(0,0,0,0.85) 70%)",
              backdropFilter: "blur(24px) saturate(0.8)",
              WebkitBackdropFilter: "blur(24px) saturate(0.8)",
            }}
          />

          {/* ── Subtle animated grid pattern ── */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          {/* ── Flash overlay on win ── */}
          <AnimatePresence>
            {flashActive && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
              />
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════════ */}
          {/* PHASE A: The Crate                         */}
          {/* ═══════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            {phase === "crate" && (
              <motion.div
                key="crate"
                className="relative z-10 flex flex-col items-center gap-8"
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: -40, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Glow ring behind crate */}
                <div className="absolute -inset-16 rounded-full opacity-40"
                  style={{
                    background: "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)",
                    filter: "blur(40px)",
                  }}
                />

                {/* The crate button */}
                <motion.button
                  id="crate-button"
                  onClick={handleCrateClick}
                  className="group relative flex cursor-pointer flex-col items-center gap-6 rounded-2xl border border-white/10 px-16 py-12"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(30,30,35,0.9) 0%, rgba(15,15,18,0.95) 100%)",
                    boxShadow:
                      "0 0 60px rgba(220,38,38,0.2), 0 0 120px rgba(220,38,38,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                  animate={{
                    scale: [1, 1.04, 1],
                    boxShadow: [
                      "0 0 60px rgba(220,38,38,0.2), 0 0 120px rgba(220,38,38,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
                      "0 0 80px rgba(220,38,38,0.35), 0 0 150px rgba(220,38,38,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
                      "0 0 60px rgba(220,38,38,0.2), 0 0 120px rgba(220,38,38,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    scale: 1.08,
                    boxShadow:
                      "0 0 100px rgba(220,38,38,0.5), 0 0 200px rgba(220,38,38,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Corner accents */}
                  <div className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-red-500/40 rounded-tl-md" />
                  <div className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-red-500/40 rounded-tr-md" />
                  <div className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-red-500/40 rounded-bl-md" />
                  <div className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-red-500/40 rounded-br-md" />

                  {/* Icon */}
                  <div className="relative">
                    <Package
                      size={72}
                      strokeWidth={1.2}
                      className="text-white/80 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-colors duration-300 group-hover:text-white"
                    />
                    {/* metallic shine line */}
                    <div
                      className="pointer-events-none absolute inset-0 overflow-hidden rounded"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.05) 50%, transparent 55%)",
                      }}
                    />
                  </div>

                  {/* Label */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-lg font-bold tracking-wider text-white/90 uppercase">
                      Secure Crate
                    </span>
                    <span
                      className="text-xs font-semibold tracking-[0.2em] text-red-400/80 uppercase"
                      style={{ textShadow: "0 0 12px rgba(220,38,38,0.5)" }}
                    >
                      ★ LEGENDARY ★
                    </span>
                  </div>
                </motion.button>

                {/* CTA text */}
                <motion.p
                  className="text-sm font-semibold tracking-[0.25em] text-white/50 uppercase"
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  Click to Open
                </motion.p>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE B: The Roulette Spin                 */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "spinning" && (
              <motion.div
                key="roulette"
                className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(6px)" }}
                transition={{ duration: 0.5 }}
              >
                {/* Title */}
                <motion.p
                  className="text-sm font-bold tracking-[0.3em] text-red-400/80 uppercase"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Opening Crate...
                </motion.p>

                {/* Roulette window */}
                <div
                  className="relative w-full overflow-hidden rounded-xl border border-white/10"
                  style={{
                    height: "140px",
                    background:
                      "linear-gradient(180deg, rgba(15,15,20,0.95) 0%, rgba(10,10,14,0.98) 100%)",
                    boxShadow:
                      "0 0 40px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3), 0 0 60px rgba(220,38,38,0.1)",
                  }}
                >
                  {/* Fade edges */}
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(10,10,14,1) 0%, transparent 100%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24"
                    style={{
                      background:
                        "linear-gradient(270deg, rgba(10,10,14,1) 0%, transparent 100%)",
                    }}
                  />

                  {/* Center target line */}
                  <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-[3px] -translate-x-1/2">
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(220,38,38,0.9) 0%, #ef4444 50%, rgba(220,38,38,0.9) 100%)",
                        boxShadow: "0 0 15px rgba(220,38,38,0.8), 0 0 30px rgba(220,38,38,0.4)",
                      }}
                    />
                  </div>
                  {/* Target triangle top */}
                  <div
                    className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderTop: "10px solid #ef4444",
                      filter: "drop-shadow(0 0 6px rgba(220,38,38,0.8))",
                    }}
                  />
                  {/* Target triangle bottom */}
                  <div
                    className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderBottom: "10px solid #ef4444",
                      filter: "drop-shadow(0 0 6px rgba(220,38,38,0.8))",
                    }}
                  />

                  {/* Scrolling strip */}
                  <div
                    ref={stripRef}
                    className="absolute left-0 top-0 flex h-full items-center"
                    style={{ willChange: "transform" }}
                  >
                    {STRIP.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={i}
                          className="flex h-full flex-col items-center justify-center gap-2 border-r border-white/[0.04]"
                          style={{
                            width: `${ITEM_WIDTH}px`,
                            minWidth: `${ITEM_WIDTH}px`,
                            background: item.isWinner
                              ? "linear-gradient(180deg, rgba(220,38,38,0.15) 0%, rgba(127,29,29,0.2) 100%)"
                              : "transparent",
                          }}
                        >
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-lg border"
                            style={{
                              borderColor: item.isWinner
                                ? "rgba(220,38,38,0.5)"
                                : "rgba(255,255,255,0.08)",
                              background: item.isWinner
                                ? "rgba(220,38,38,0.1)"
                                : "rgba(255,255,255,0.03)",
                              boxShadow: item.isWinner
                                ? "0 0 20px rgba(220,38,38,0.3)"
                                : "none",
                            }}
                          >
                            <Icon
                              size={26}
                              strokeWidth={1.5}
                              style={{ color: item.color }}
                            />
                          </div>
                          <span
                            className="max-w-[100px] truncate text-center text-[10px] font-medium"
                            style={{
                              color: item.isWinner
                                ? "rgba(239,68,68,0.9)"
                                : "rgba(255,255,255,0.4)",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mechanical ticks indicator */}
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-1.5 w-1.5 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-white/30">
                    Determining outcome...
                  </span>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* PHASE C: The Unlock Pop-up                 */}
            {/* ═══════════════════════════════════════════ */}
            {phase === "result" && (
              <motion.div
                key="result"
                className="relative z-10 flex flex-col items-center gap-8"
                initial={{ opacity: 0, scale: 0.5, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  scale: { type: "spring", stiffness: 200, damping: 15 },
                }}
              >
                {/* Celebration particles */}
                {particles.current.map((p) => (
                  <motion.div
                    key={p.id}
                    className="pointer-events-none absolute rounded-full"
                    style={{
                      width: p.size,
                      height: p.size,
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      background:
                        p.id % 3 === 0
                          ? "#ef4444"
                          : p.id % 3 === 1
                            ? "#f59e0b"
                            : "#ffffff",
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      y: [0, -60 - Math.random() * 80],
                      x: [(Math.random() - 0.5) * 100],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      repeat: Infinity,
                      repeatDelay: Math.random() * 1.5,
                    }}
                  />
                ))}

                {/* Trophy icon with glow */}
                <motion.div
                  className="relative"
                  animate={{
                    filter: [
                      "drop-shadow(0 0 20px rgba(220,38,38,0.5))",
                      "drop-shadow(0 0 40px rgba(220,38,38,0.8))",
                      "drop-shadow(0 0 20px rgba(220,38,38,0.5))",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-2xl border border-red-500/30"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(127,29,29,0.3) 100%)",
                      boxShadow: "0 0 40px rgba(220,38,38,0.3)",
                    }}
                  >
                    <Rocket size={44} strokeWidth={1.5} className="text-red-400" />
                  </div>
                </motion.div>

                {/* Congrats text */}
                <div className="flex flex-col items-center gap-3">
                  <motion.p
                    className="text-sm font-bold tracking-[0.3em] text-red-400/70 uppercase"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Congrats!
                  </motion.p>
                  <motion.h2
                    className="text-center text-3xl font-extrabold text-white md:text-4xl"
                    style={{
                      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                      letterSpacing: "-0.03em",
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    You Unlocked
                  </motion.h2>
                  <motion.p
                    className="text-lg font-medium text-white/60"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Srinivas R C&apos;s Portfolio
                  </motion.p>
                </div>

                {/* Item badge */}
                <motion.div
                  className="flex items-center gap-3 rounded-xl border border-red-500/20 px-6 py-3"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(127,29,29,0.15) 100%)",
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Rocket size={20} className="text-red-400" />
                  <span className="text-sm font-bold text-red-400">
                    Portfolio Access
                  </span>
                  <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 uppercase">
                    Legendary
                  </span>
                </motion.div>

                {/* Continue button */}
                <motion.button
                  id="btn-continue-portfolio"
                  onClick={handleExit}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-red-500/40 px-10 py-4 text-base font-bold text-white transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(220,38,38,0.25) 0%, rgba(153,27,27,0.35) 100%)",
                    boxShadow:
                      "0 0 30px rgba(220,38,38,0.4), 0 0 60px rgba(220,38,38,0.15)",
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow:
                      "0 0 50px rgba(220,38,38,0.6), 0 0 100px rgba(220,38,38,0.25)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  {/* Shimmer */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2.5s ease-in-out infinite",
                    }}
                  />
                  <span className="relative z-10">Continue to Portfolio →</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
