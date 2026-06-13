"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, FileText, Code2, Scroll, Cpu, Briefcase,
  GraduationCap, Award, Github, Mail, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ─────────────── RARITY TIERS ─────────────── */
type Rarity = "blue" | "purple" | "pink" | "gold";

interface SectionItem {
  id: string;
  name: string;
  icon: typeof FileText;
  rarity: Rarity;
}

const RARITY_META: Record<Rarity, { label: string; weight: number; hex: string }> = {
  blue:   { label: "Common",     weight: 0.60, hex: "#4B69FF" },
  purple: { label: "Mythical",   weight: 0.25, hex: "#8847FF" },
  pink:   { label: "Legendary",  weight: 0.14, hex: "#D32EE6" },
  gold:   { label: "Contraband", weight: 0.01, hex: "#FFD700" },
};

/* Rarity-specific Tailwind glow classes */
const RARITY_GLOW: Record<Rarity, { border: string; shadow: string }> = {
  blue:   { border: "border-blue-500/30",   shadow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]" },
  purple: { border: "border-purple-500/50", shadow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]" },
  pink:   { border: "border-pink-500/70",   shadow: "shadow-[0_0_25px_rgba(236,72,153,0.6)]" },
  gold:   { border: "border-yellow-400/90", shadow: "shadow-[0_0_40px_rgba(250,204,21,0.8)]" },
};

const SECTIONS: SectionItem[] = [
  // Blue - Common (60%)
  { id: "skills",         name: "Skills",         icon: Cpu,           rarity: "blue" },
  { id: "education",      name: "Education",      icon: GraduationCap, rarity: "blue" },
  { id: "contact",        name: "Contact",        icon: Mail,          rarity: "blue" },
  // Purple - Mythical (25%)
  { id: "projects",       name: "Projects",       icon: Code2,         rarity: "purple" },
  { id: "experience",     name: "Experience",     icon: Briefcase,     rarity: "purple" },
  // Pink - Legendary (14%)
  { id: "open-source",    name: "Open Source",    icon: Github,        rarity: "pink" },
  { id: "certifications", name: "Certifications", icon: Award,         rarity: "pink" },
  // Gold - Contraband (1%)
  { id: "resume",         name: "Resume",         icon: FileText,      rarity: "gold" },
  { id: "cv",             name: "CV",             icon: Scroll,        rarity: "gold" },
];

/* ─── Weighted item pool builder ─── */
function pickWeightedSection(): SectionItem {
  const r = Math.random();
  let cumulative = 0;
  const grouped: Record<Rarity, SectionItem[]> = { blue: [], purple: [], pink: [], gold: [] };
  SECTIONS.forEach(s => grouped[s.rarity].push(s));

  for (const rarity of ["blue", "purple", "pink", "gold"] as Rarity[]) {
    cumulative += RARITY_META[rarity].weight;
    if (r <= cumulative) {
      const pool = grouped[rarity];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return grouped.blue[0];
}

function generateReelItems(): { items: SectionItem[]; winnerIdx: number } {
  const TOTAL = 60;
  const WIN_IDX = 55;
  const items: SectionItem[] = [];
  const winner = pickWeightedSection();

  for (let i = 0; i < TOTAL; i++) {
    items.push(i === WIN_IDX ? winner : pickWeightedSection());
  }
  return { items, winnerIdx: WIN_IDX };
}

/* ─── Audio helpers (WebAudio API — no external files) ─── */
function playTickSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1800;
    osc.type = "sine";
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
}

function playRevealSound(rarity: Rarity) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const freqs = { blue: [523, 659], purple: [659, 784], pink: [784, 988], gold: [988, 1319, 1568] };
    const tones = freqs[rarity];
    tones.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = f;
      osc.type = rarity === "gold" ? "sine" : "triangle";
      gain.gain.value = rarity === "gold" ? 0.15 : 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5 + i * 0.15);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + 0.5 + i * 0.15);
    });
  } catch {}
}

function playUnlockSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

/* ─── Constants ─── */
const CARD_W = 160;
const CARD_GAP = 12;
const CARD_TOTAL = CARD_W + CARD_GAP;

/* ═══════════════ COMPONENT ═══════════════ */
export default function GambleModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [spinState, setSpinState] = useState<"idle" | "phase1_snap" | "phase2_lift" | "phase3_dive" | "spinning" | "revealed">("idle");
  const [showInfo, setShowInfo] = useState(false);
  const [reelData, setReelData] = useState<{ items: SectionItem[]; winnerIdx: number } | null>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const lastTickIdx = useRef(-1);

  // Listen for open event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSpinState("idle");
      setReelData(null);
    };
    window.addEventListener("openGambleModal", handleOpen);
    return () => window.removeEventListener("openGambleModal", handleOpen);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSpinState("idle");
    setReelData(null);
    setShowInfo(false);
  }, []);

  /* ─── Case unlock sequence ─── */
  const handleCrateClick = useCallback(() => {
    if (spinState !== "idle") return;

    // Trigger latch-snap audio here
    playUnlockSound();
    
    // Phase 1 (The Snap)
    setSpinState("phase1_snap");

    // Phase 2 (The Lid Lift) - after short snap vibration
    setTimeout(() => {
      setSpinState("phase2_lift");
    }, 150);

    // Phase 3 (The Dive)
    setTimeout(() => {
      setSpinState("phase3_dive");
    }, 550);

    // Fade into spinning reel
    setTimeout(() => {
      const data = generateReelItems();
      setReelData(data);
      lastTickIdx.current = -1;
      setSpinState("spinning");
    }, 950);
  }, [spinState]);

  /* ─── Spin animation (rAF with quartic ease-out) ─── */
  useEffect(() => {
    if (spinState !== "spinning" || !reelData || !reelRef.current) return;

    const el = reelRef.current;
    const containerW = el.parentElement?.clientWidth ?? 800;
    const centerOffset = containerW / 2 - CARD_W / 2;
    const targetX = reelData.winnerIdx * CARD_TOTAL - centerOffset;

    let startTime: number | null = null;
    const DURATION = 6500;
    let rafId: number;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(elapsed / DURATION, 1);

      // CS2-style deceleration: cubic-bezier(0.15, 0.9, 0.1, 1) approximation
      const progress = 1 - Math.pow(1 - t, 4);
      const currentX = progress * targetX;

      el.style.transform = `translateX(-${currentX}px)`;

      // Tick sound when crossing card boundaries
      const crossedIdx = Math.floor((currentX + centerOffset) / CARD_TOTAL);
      if (crossedIdx > lastTickIdx.current && crossedIdx < reelData.items.length) {
        lastTickIdx.current = crossedIdx;
        playTickSound();
      }

      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        el.style.transform = `translateX(-${targetX}px)`;
        const winner = reelData.items[reelData.winnerIdx];
        playRevealSound(winner.rarity);
        setSpinState("revealed");
        toast.success(`${RARITY_META[winner.rarity].label}: ${winner.name}!`, { duration: 4000 });
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [spinState, reelData]);

  /* ─── Try Again ─── */
  const handleTryAgain = useCallback(() => {
    if (reelRef.current) reelRef.current.style.transform = "translateX(0px)";
    lastTickIdx.current = -1;
    const data = generateReelItems();
    setReelData(data);
    setSpinState("spinning");
  }, []);

  const winnerItem = reelData ? reelData.items[reelData.winnerIdx] : null;
  const isGold = winnerItem?.rarity === "gold";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(2,2,6,0.96)", backdropFilter: "blur(24px)" }}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
      ref={(el) => { if (el) el.focus(); }}
    >
      {/* Close button */}
      <button onClick={closeModal} className="absolute top-5 right-5 z-50 text-white/40 hover:text-white transition-colors">
        <X size={28} />
      </button>

      {/* Info button */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="absolute top-5 right-16 z-50 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:border-white/50 transition-all"
      >
        <Info size={14} />
      </button>

      {/* Info Popover */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-16 right-5 z-50 w-64 rounded-xl border border-white/10 p-4"
            style={{ background: "rgba(15,15,25,0.95)", backdropFilter: "blur(20px)" }}
          >
            <h4 className="font-space font-bold text-sm mb-3 text-white/80">Drop Rates</h4>
            {(["blue", "purple", "pink", "gold"] as Rarity[]).map((r) => (
              <div key={r} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: RARITY_META[r].hex }} />
                  <span className="text-sm text-white/70">{RARITY_META[r].label}</span>
                </div>
                <span className="text-sm font-mono font-bold" style={{ color: RARITY_META[r].hex }}>
                  {(RARITY_META[r].weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CRATE PHASE ═══ */}
      <AnimatePresence mode="wait">
        {(spinState === "idle" || spinState === "phase1_snap" || spinState === "phase2_lift" || spinState === "phase3_dive") && (
          <motion.div
            key="crate"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              spinState === "phase3_dive"
                ? { scale: 1.6, opacity: 0, transition: { duration: 0.45, ease: "easeIn" } }
                : { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
            }
            exit={{ opacity: 0 }}
            className="flex flex-col items-center cursor-pointer select-none"
            style={{ perspective: 1200 }}
            onClick={handleCrateClick}
          >
            {/* ─── The Premium Tactical Hard Case ─── */}
            <motion.div
              animate={spinState === "phase1_snap"
                ? { y: [-3, 3, -3, 3, -1, 1, 0], x: [-1, 1, -2, 2, 0] }
                : {}
              }
              transition={spinState === "phase1_snap" ? { duration: 0.12 } : {}}
              className="relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Ambient glow behind case */}
              <div
                className="absolute inset-0 -m-8 rounded-3xl pointer-events-none z-0"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(234,179,8,0.12) 0%, transparent 70%)",
                  filter: "blur(30px)",
                }}
              />

              {/* ── BOTTOM HALF (Base) ── */}
              <div
                className="relative w-80 h-28 rounded-b-xl z-10"
                style={{
                  background: "linear-gradient(180deg, #C89B3C 0%, #A67C10 40%, #8B6914 100%)",
                  boxShadow: "inset 0 -8px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,120,0.3), 0 12px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                {/* Textured ridges */}
                <div className="absolute inset-x-0 top-3 bottom-3 flex flex-col justify-evenly px-6 opacity-[0.12]">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="h-[2px] w-full bg-black rounded-full" />
                  ))}
                </div>
                {/* Base front edge highlight */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent" />
                {/* Rubber feet */}
                {[["bottom-2 left-4"], ["bottom-2 right-4"]].map((pos, i) => (
                  <div key={i} className={`absolute ${pos[0]} w-6 h-2 rounded-full bg-zinc-900/80`} />
                ))}
              </div>

              {/* ── TOP HALF (The Lid) ── */}
              <motion.div
                className="absolute top-0 left-0 w-80 h-28 rounded-t-xl z-20"
                style={{
                  transformOrigin: "bottom center",
                  background: "linear-gradient(0deg, #B8941E 0%, #D4A825 30%, #E8C84A 70%, #D4A825 100%)",
                  boxShadow: "inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -2px 8px rgba(0,0,0,0.3), 0 -2px 10px rgba(0,0,0,0.15)",
                }}
                animate={
                  (spinState === "phase2_lift" || spinState === "phase3_dive")
                    ? { rotateX: 65 }
                    : { rotateX: 0 }
                }
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Top edge highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent" />

                {/* Textured ridges on lid */}
                <div className="absolute inset-x-0 top-4 bottom-6 flex flex-col justify-evenly px-6 opacity-[0.1]">
                  {[0,1,2].map(i => (
                    <div key={i} className="h-[2px] w-full bg-black rounded-full" />
                  ))}
                </div>

                {/* ── LATCHES ── */}
                <div className="absolute -bottom-4 left-[52px] z-30" style={{ perspective: 400 }}>
                  <motion.div
                    animate={spinState !== "idle" ? { rotateX: -170, y: -6 } : { rotateX: 0, y: 0 }}
                    style={{ transformOrigin: "top center" }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  >
                    <div className="w-10 h-7 rounded-b-sm relative"
                      style={{
                        background: "linear-gradient(180deg, #3f3f46, #27272a, #18181b)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.6)",
                      }}
                    >
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-zinc-500/50" />
                    </div>
                  </motion.div>
                </div>
                <div className="absolute -bottom-4 right-[52px] z-30" style={{ perspective: 400 }}>
                  <motion.div
                    animate={spinState !== "idle" ? { rotateX: -170, y: -6 } : { rotateX: 0, y: 0 }}
                    style={{ transformOrigin: "top center" }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  >
                    <div className="w-10 h-7 rounded-b-sm relative"
                      style={{
                        background: "linear-gradient(180deg, #3f3f46, #27272a, #18181b)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.6)",
                      }}
                    >
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-zinc-500/50" />
                    </div>
                  </motion.div>
                </div>

                {/* ── CENTER LOGO ── */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={spinState === "idle" ? { scale: [1, 1.06, 1] } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 -m-2 rounded-lg rotate-45 opacity-50"
                      style={{ boxShadow: "0 0 20px rgba(139,92,246,0.5), 0 0 40px rgba(6,182,212,0.3)" }}
                    />
                    {/* Diamond shape */}
                    <div className="w-14 h-14 rotate-45 rounded-md flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                        boxShadow: "0 0 24px rgba(139,92,246,0.6), inset 0 1px 2px rgba(255,255,255,0.3)",
                      }}
                    >
                      <div className="w-9 h-9 rounded-sm flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, #1e1b4b, #0c0a1a)",
                          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
                        }}
                      >
                        <div className="w-3 h-3 rounded-full"
                          style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)", opacity: 0.8 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Corner reinforcements */}
                {["top-2 left-2", "top-2 right-2"].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-3 h-3`}>
                    <div className="w-full h-[2px] bg-yellow-800/40 rounded-full" />
                    <div className="w-[2px] h-full bg-yellow-800/40 rounded-full absolute top-0 left-0" />
                  </div>
                ))}
              </motion.div>

              {/* Side edge detail */}
              <div className="absolute top-[112px] left-0 w-[2px] h-[112px] bg-gradient-to-b from-yellow-600/60 to-yellow-900/40 z-5" />
              <div className="absolute top-[112px] right-0 w-[2px] h-[112px] bg-gradient-to-b from-yellow-600/60 to-yellow-900/40 z-5" />
            </motion.div>

            {/* Text below case */}
            <motion.div
              className="mt-10 flex flex-col items-center"
              animate={spinState === "phase3_dive" ? { opacity: 0 } : { opacity: 1 }}
            >
              <h2 className="text-3xl font-black tracking-[0.15em] text-white/90 font-space">TRY YOUR LUCK</h2>
              <p className="text-sm font-semibold tracking-[0.25em] text-white/40 mt-2 font-space">TO GET DETAILS</p>
            </motion.div>

            {/* Pulsing click hint */}
            <motion.p
              animate={spinState === "phase3_dive" ? { opacity: 0 } : { opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="mt-5 text-xs text-white/25 font-space tracking-[0.2em] uppercase"
            >
              Click to unlock
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REEL PHASE ═══ */}
      <AnimatePresence>
        {(spinState === "spinning" || spinState === "revealed") && reelData && (
          <motion.div
            key="reel"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl mx-auto px-4 flex flex-col items-center"
          >
            {/* Reel viewport */}
            <div className="relative w-full" style={{ height: 220 }}>
              {/* Top triangle marker */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "14px solid #FF6584" }} />
              </div>
              {/* Bottom triangle marker */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "14px solid #FF6584" }} />
              </div>

              {/* Neon center target line */}
              <div
                className="absolute top-0 bottom-0 left-1/2 -translate-x-[0.5px] w-[2px] z-20"
                style={{ background: "#FF6584", boxShadow: "0 0 12px rgba(255,101,132,0.8), 0 0 24px rgba(255,101,132,0.4)" }}
              />

              {/* Edge gradient masks */}
              <div className="absolute top-0 bottom-0 left-0 w-28 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,1), transparent)" }} />
              <div className="absolute top-0 bottom-0 right-0 w-28 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, rgba(0,0,0,1), transparent)" }} />

              {/* Reel container with strict containment */}
              <div
                className="w-full h-full overflow-hidden rounded-xl border border-white/5"
                style={{ contain: "strict" }}
              >
                <div
                  ref={reelRef}
                  className="flex h-full items-center gap-3 pl-3"
                  style={{
                    willChange: "transform",
                    width: `${reelData.items.length * CARD_TOTAL}px`,
                  }}
                >
                  {reelData.items.map((item, i) => {
                    const Icon = item.icon;
                    const isWinner = spinState === "revealed" && i === reelData.winnerIdx;
                    const isGoldItem = item.rarity === "gold";
                    const glow = RARITY_GLOW[item.rarity];

                    /* Glassmorphism base: transparent + backdrop-blur + rarity glow border/shadow */
                    const cardClasses = [
                      "flex-shrink-0 rounded-lg flex flex-col items-center justify-center",
                      "backdrop-blur-md border",
                      isGoldItem
                        ? "bg-gradient-to-b from-yellow-500/20 to-yellow-700/40 border-yellow-500/50"
                        : "bg-[#0F0F1A]/40 border-white/10",
                      glow.border,
                      glow.shadow,
                    ].join(" ");

                    const cardContent = (
                      <>
                        {/* Rarity bar top edge */}
                        <div className="w-full h-1 rounded-t-lg" style={{ background: RARITY_META[item.rarity].hex }} />
                        <div className="flex-1 flex flex-col items-center justify-center p-3">
                          <Icon size={38} style={{ color: RARITY_META[item.rarity].hex }} className="mb-3" />
                          <span className="font-space font-bold text-sm text-center text-white/90 leading-tight">
                            {item.name}
                          </span>
                          <span
                            className="text-[10px] mt-1.5 font-mono uppercase tracking-wider"
                            style={{ color: RARITY_META[item.rarity].hex, opacity: 0.7 }}
                          >
                            {RARITY_META[item.rarity].label}
                          </span>
                        </div>
                      </>
                    );

                    return (
                      <div
                        key={i}
                        className={cardClasses}
                        style={{
                          width: CARD_W,
                          height: 180,
                          opacity: isWinner ? 1 : spinState === "revealed" ? 0.3 : 0.85,
                          transition: "opacity 0.5s ease",
                        }}
                      >
                        {/* Winner gets the reveal pulse animation */}
                        {isWinner ? (
                          <motion.div
                            className="w-full h-full flex flex-col rounded-lg overflow-hidden"
                            animate={{
                              scale: [1, 1.05, 1],
                              filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            {cardContent}
                          </motion.div>
                        ) : (
                          cardContent
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gold reveal radial overlay */}
            <AnimatePresence>
              {spinState === "revealed" && isGold && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0.2, 0.5, 0.15] }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 pointer-events-none z-30"
                  style={{ background: "radial-gradient(circle at center, rgba(255,215,0,0.3) 0%, transparent 60%)" }}
                />
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="mt-10 flex flex-col items-center gap-4">
              {spinState === "revealed" && winnerItem && (
                <>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => {
                      closeModal();
                      window.location.href = `/section/${winnerItem.id}`;
                    }}
                    className="px-10 py-3.5 rounded-full font-space font-bold text-lg tracking-wider uppercase transition-all min-h-[44px]"
                    style={{
                      background: isGold
                        ? "linear-gradient(135deg, #FFD700, #FFA500)"
                        : `linear-gradient(135deg, ${RARITY_META[winnerItem.rarity].hex}, ${RARITY_META[winnerItem.rarity].hex}99)`,
                      color: isGold ? "#000" : "#fff",
                      boxShadow: isGold
                        ? "0 0 40px rgba(250,204,21,0.8)"
                        : `0 0 20px ${RARITY_META[winnerItem.rarity].hex}66`,
                    }}
                  >
                    View {winnerItem.name}
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={handleTryAgain}
                    className="text-sm text-white/40 hover:text-white/70 font-space tracking-wider uppercase transition-colors"
                  >
                    Try Again
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
