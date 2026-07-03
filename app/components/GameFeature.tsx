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
  X,
  Download,
  Eye,
} from "lucide-react";

/* ─── Roulette Items ─── */
interface RouletteItem {
  icon: React.ElementType;
  label: string;
  color: string;
  isWinner?: boolean;
}

/* ─── Possible rewards the user can unlock ─── */
const REWARDS = [
  {
    label: "Spider-Verse Wallpaper",
    description: "Exclusive 4K wallpaper featuring the Spider-Verse aesthetic.",
    badge: "RARE",
    badgeColor: "#3b82f6",
  },
  {
    label: "Hidden Project: NeuroForge",
    description: "A secret AI agent project — early access preview & design docs.",
    badge: "LEGENDARY",
    badgeColor: "#ef4444",
  },
  {
    label: "AI Personality Insight",
    description: "Unlock a special prompt revealing my coding philosophy & workflow.",
    badge: "EPIC",
    badgeColor: "#a855f7",
  },
];

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

const WINNER_ITEM: RouletteItem = {
  icon: Rocket,
  label: "Easter Egg",
  color: "#ef4444",
  isWinner: true,
};

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
const WINNER_INDEX = 53;
const ITEM_WIDTH = 110;
const STRIP = buildStrip(TOTAL_SLOTS, WINNER_INDEX);

/* ─── Phases ─── */
type Phase = "crate" | "spinning" | "result";

/* ─── Props ─── */
interface GameFeatureProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Component ─── */
export default function GameFeature({ isOpen, onClose }: GameFeatureProps) {
  const [phase, setPhase] = useState<Phase>("crate");
  const [flashActive, setFlashActive] = useState(false);
  const [currentReward] = useState(
    () => REWARDS[Math.floor(Math.random() * REWARDS.length)]
  );
  const stripRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  /* ── Reset state when modal opens ── */
  useEffect(() => {
    if (isOpen) {
      setPhase("crate");
      setFlashActive(false);
      /* Reset strip position */
      if (stripRef.current) {
        stripRef.current.style.transition = "none";
        stripRef.current.style.transform = "translateX(0px)";
      }
    }
  }, [isOpen]);

  /* ── Lock body scroll while modal is open ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── Simple tick sound ── */
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
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      /* silent fallback */
    }
  }, []);

  /* ── Spin handler ── */
  const handleSpin = useCallback(() => {
    setPhase("spinning");

    const targetOffset = WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2;

    if (stripRef.current) {
      const container = stripRef.current.parentElement;
      const containerWidth = container?.clientWidth ?? 500;
      const finalX = -(targetOffset - containerWidth / 2);

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

    const tickInterval = setInterval(() => playTickSound(), 80);
    setTimeout(() => clearInterval(tickInterval), 3500);

    setTimeout(() => {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 400);
      setPhase("result");
    }, 4800);
  }, [playTickSound]);

  /* ── Close + reset ── */
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  /* ── Particles for result ── */
  const particles = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 2 + 1.5,
      delay: Math.random() * 0.8,
    }))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="game-feature-modal"
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* ── Backdrop — click to close ── */}
          <motion.div
            className="absolute inset-0 cursor-pointer"
            onClick={phase !== "spinning" ? handleClose : undefined}
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(16px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            style={{ background: "rgba(0,0,0,0.7)" }}
          />

          {/* ── Flash overlay on win ── */}
          <AnimatePresence>
            {flashActive && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  background: "radial-gradient(circle, #fff 0%, transparent 70%)",
                }}
              />
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════════ */}
          {/* MODAL CARD                                 */}
          {/* ═══════════════════════════════════════════ */}
          <motion.div
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.08]"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              background:
                "linear-gradient(180deg, rgba(15,15,20,0.97) 0%, rgba(8,8,12,0.99) 100%)",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(220,38,38,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* ── Close button ── */}
            {phase !== "spinning" && (
              <motion.button
                id="game-close-btn"
                onClick={handleClose}
                className="absolute right-4 top-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={16} strokeWidth={2} />
              </motion.button>
            )}

            {/* ── Subtle grid pattern ── */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            {/* ── Content ── */}
            <div className="relative p-8">
              <AnimatePresence mode="wait">
                {/* ═══════════════════════════════════ */}
                {/* PHASE A — The Crate                */}
                {/* ═══════════════════════════════════ */}
                {phase === "crate" && (
                  <motion.div
                    key="crate"
                    className="flex flex-col items-center gap-6"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      y: -10,
                      filter: "blur(6px)",
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Header */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold tracking-[0.3em] text-red-400/60 uppercase">
                        Easter Egg Hunt
                      </span>
                      <h3 className="text-xl font-bold text-white">
                        Open a Case
                      </h3>
                      <p className="text-sm text-white/40">
                        Spin the roulette to unlock hidden content
                      </p>
                    </div>

                    {/* Crate */}
                    <motion.button
                      id="crate-spin-btn"
                      onClick={handleSpin}
                      className="group relative flex cursor-pointer flex-col items-center gap-4 rounded-xl border border-white/10 px-14 py-10"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(30,30,35,0.9) 0%, rgba(15,15,18,0.95) 100%)",
                        boxShadow:
                          "0 0 40px rgba(220,38,38,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                      }}
                      animate={{
                        scale: [1, 1.03, 1],
                        boxShadow: [
                          "0 0 40px rgba(220,38,38,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                          "0 0 60px rgba(220,38,38,0.25), inset 0 1px 0 rgba(255,255,255,0.07)",
                          "0 0 40px rgba(220,38,38,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      whileHover={{
                        scale: 1.06,
                        boxShadow:
                          "0 0 70px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {/* Corner accents */}
                      <div className="absolute left-2.5 top-2.5 h-4 w-4 rounded-tl-sm border-l-2 border-t-2 border-red-500/40" />
                      <div className="absolute right-2.5 top-2.5 h-4 w-4 rounded-tr-sm border-r-2 border-t-2 border-red-500/40" />
                      <div className="absolute bottom-2.5 left-2.5 h-4 w-4 rounded-bl-sm border-b-2 border-l-2 border-red-500/40" />
                      <div className="absolute bottom-2.5 right-2.5 h-4 w-4 rounded-br-sm border-b-2 border-r-2 border-red-500/40" />

                      <Package
                        size={56}
                        strokeWidth={1.2}
                        className="text-white/80 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-colors duration-300 group-hover:text-white"
                      />

                      <div className="flex flex-col items-center gap-1">
                        <span className="text-base font-bold tracking-wider text-white/90 uppercase">
                          Secure Crate
                        </span>
                        <span
                          className="text-[10px] font-semibold tracking-[0.2em] text-red-400/70 uppercase"
                          style={{
                            textShadow: "0 0 10px rgba(220,38,38,0.4)",
                          }}
                        >
                          ★ LEGENDARY ★
                        </span>
                      </div>
                    </motion.button>

                    {/* CTA */}
                    <motion.p
                      className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      Click the crate to spin
                    </motion.p>
                  </motion.div>
                )}

                {/* ═══════════════════════════════════ */}
                {/* PHASE B — The Roulette Spin         */}
                {/* ═══════════════════════════════════ */}
                {phase === "spinning" && (
                  <motion.div
                    key="roulette"
                    className="flex flex-col items-center gap-5"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      filter: "blur(4px)",
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.p
                      className="text-xs font-bold tracking-[0.3em] text-red-400/80 uppercase"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Opening Crate...
                    </motion.p>

                    {/* Roulette window */}
                    <div
                      className="relative w-full overflow-hidden rounded-xl border border-white/10"
                      style={{
                        height: "120px",
                        background:
                          "linear-gradient(180deg, rgba(12,12,16,0.95) 0%, rgba(8,8,11,0.98) 100%)",
                        boxShadow:
                          "inset 0 0 20px rgba(0,0,0,0.4), 0 0 30px rgba(220,38,38,0.06)",
                      }}
                    >
                      {/* Fade edges */}
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(10,10,14,1) 0%, transparent 100%)",
                        }}
                      />
                      <div
                        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16"
                        style={{
                          background:
                            "linear-gradient(270deg, rgba(10,10,14,1) 0%, transparent 100%)",
                        }}
                      />

                      {/* Center target line */}
                      <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-[2px] -translate-x-1/2">
                        <div
                          className="h-full w-full"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(220,38,38,0.9) 0%, #ef4444 50%, rgba(220,38,38,0.9) 100%)",
                            boxShadow:
                              "0 0 12px rgba(220,38,38,0.7), 0 0 24px rgba(220,38,38,0.3)",
                          }}
                        />
                      </div>
                      {/* Top triangle */}
                      <div
                        className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: "6px solid transparent",
                          borderRight: "6px solid transparent",
                          borderTop: "8px solid #ef4444",
                          filter:
                            "drop-shadow(0 0 4px rgba(220,38,38,0.7))",
                        }}
                      />
                      {/* Bottom triangle */}
                      <div
                        className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: "6px solid transparent",
                          borderRight: "6px solid transparent",
                          borderBottom: "8px solid #ef4444",
                          filter:
                            "drop-shadow(0 0 4px rgba(220,38,38,0.7))",
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
                              className="flex h-full flex-col items-center justify-center gap-1.5 border-r border-white/[0.04]"
                              style={{
                                width: `${ITEM_WIDTH}px`,
                                minWidth: `${ITEM_WIDTH}px`,
                                background: item.isWinner
                                  ? "linear-gradient(180deg, rgba(220,38,38,0.12) 0%, rgba(127,29,29,0.15) 100%)"
                                  : "transparent",
                              }}
                            >
                              <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg border"
                                style={{
                                  borderColor: item.isWinner
                                    ? "rgba(220,38,38,0.5)"
                                    : "rgba(255,255,255,0.06)",
                                  background: item.isWinner
                                    ? "rgba(220,38,38,0.08)"
                                    : "rgba(255,255,255,0.02)",
                                  boxShadow: item.isWinner
                                    ? "0 0 15px rgba(220,38,38,0.25)"
                                    : "none",
                                }}
                              >
                                <Icon
                                  size={22}
                                  strokeWidth={1.5}
                                  style={{ color: item.color }}
                                />
                              </div>
                              <span
                                className="max-w-[90px] truncate text-center text-[9px] font-medium"
                                style={{
                                  color: item.isWinner
                                    ? "rgba(239,68,68,0.9)"
                                    : "rgba(255,255,255,0.35)",
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-red-500"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.3, repeat: Infinity }}
                      />
                      <span className="text-[11px] font-medium text-white/30">
                        Determining outcome...
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* ═══════════════════════════════════ */}
                {/* PHASE C — The Reward               */}
                {/* ═══════════════════════════════════ */}
                {phase === "result" && (
                  <motion.div
                    key="result"
                    className="relative flex flex-col items-center gap-6"
                    initial={{
                      opacity: 0,
                      scale: 0.5,
                      filter: "blur(10px)",
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      filter: "blur(0px)",
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      scale: {
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      },
                    }}
                  >
                    {/* Particles */}
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
                          y: [0, -50 - Math.random() * 60],
                          x: [(Math.random() - 0.5) * 80],
                        }}
                        transition={{
                          duration: p.duration,
                          delay: p.delay,
                          repeat: Infinity,
                          repeatDelay: Math.random() * 1.5,
                        }}
                      />
                    ))}

                    {/* Trophy */}
                    <motion.div
                      className="relative"
                      animate={{
                        filter: [
                          "drop-shadow(0 0 15px rgba(220,38,38,0.4))",
                          "drop-shadow(0 0 30px rgba(220,38,38,0.7))",
                          "drop-shadow(0 0 15px rgba(220,38,38,0.4))",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/30"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(127,29,29,0.25) 100%)",
                          boxShadow: "0 0 30px rgba(220,38,38,0.2)",
                        }}
                      >
                        <Rocket
                          size={36}
                          strokeWidth={1.5}
                          className="text-red-400"
                        />
                      </div>
                    </motion.div>

                    {/* Congrats text */}
                    <div className="flex flex-col items-center gap-2">
                      <motion.p
                        className="text-[10px] font-bold tracking-[0.3em] text-red-400/60 uppercase"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        You Unlocked
                      </motion.p>
                      <motion.h3
                        className="text-center text-2xl font-extrabold text-white"
                        style={{ letterSpacing: "-0.02em" }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {currentReward.label}
                      </motion.h3>
                      <motion.p
                        className="max-w-xs text-center text-sm text-white/50"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {currentReward.description}
                      </motion.p>
                    </div>

                    {/* Reward badge */}
                    <motion.div
                      className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] px-5 py-2.5"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Rocket size={16} className="text-red-400" />
                      <span className="text-xs font-bold text-white/70">
                        Easter Egg
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{
                          backgroundColor: `${currentReward.badgeColor}20`,
                          color: currentReward.badgeColor,
                        }}
                      >
                        {currentReward.badge}
                      </span>
                    </motion.div>

                    {/* Action buttons */}
                    <motion.div
                      className="flex w-full gap-3"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <motion.button
                        id="btn-download-reward"
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/30 py-3.5 text-sm font-bold text-white transition-all duration-300"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(153,27,27,0.3) 100%)",
                          boxShadow:
                            "0 0 20px rgba(220,38,38,0.25)",
                        }}
                        whileHover={{
                          scale: 1.03,
                          boxShadow:
                            "0 0 35px rgba(220,38,38,0.45)",
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Download size={16} strokeWidth={2} />
                        Download Reward
                      </motion.button>

                      <motion.button
                        id="btn-view-reward"
                        onClick={handleClose}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/60 transition-all duration-300 hover:bg-white/[0.08] hover:text-white/80"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Eye size={15} strokeWidth={2} />
                        Close
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
