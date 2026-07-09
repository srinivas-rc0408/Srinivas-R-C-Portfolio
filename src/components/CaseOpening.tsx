"use client";

import { useState, useCallback, useRef, useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Package, X, ArrowRight, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { RARITIES, buildCaseItems, pickWeighted, type CaseItem, type ProjectSummary } from "@/lib/case-items";
import { CaseAudio, isMuted as readMuted, setMuted as persistMuted, buildTickSchedule } from "@/lib/case-audio";

/* ═══════════════════════════════════════════════════════════════
   CS2-STYLE CASE OPENING
   IDLE (breathing crate) → SPINNING (weighted roulette, near-miss
   landing, sample-locked ticks) → REVEAL (rarity ceremony). Every
   phase honors prefers-reduced-motion by collapsing straight to a
   400ms crossfade reveal.
   ═══════════════════════════════════════════════════════════════ */

type Phase = "IDLE" | "OPENING" | "SPINNING" | "REVEAL" | "CLOSED";

const TOTAL_SLOTS = 50;
const TARGET_INDEX = 42;
const SPIN_DURATION_MS = 4800;
const SPIN_EASE: [number, number, number, number] = [0.12, 0.99, 0.08, 1];

/* 3D case dimensions (px) — width, height, depth of the CSS box */
const CASE_W = 230;
const CASE_H = 140;
const CASE_D = 120;
/* Unlock + lid ceremony: lock pops (~0.45s) → lid springs open → roulette */
const OPENING_MS = 1400;
const LID_DELAY_S = 0.45;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getReducedMotionServer = () => false;

const MOBILE_QUERY = "(max-width: 640px)";
function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getMobile = () => window.matchMedia(MOBILE_QUERY).matches;
const getMobileServer = () => false;

import { fetcher } from "@/lib/fetcher";

/* dev-only rarity distribution tally — verifies weighted pick roughly
   tracks configured weights; stripped from behavior in production. */
const devTally: Record<string, number> = {};
function recordDevPick(item: CaseItem) {
  if (process.env.NODE_ENV !== "development") return;
  devTally[item.rarity] = (devTally[item.rarity] ?? 0) + 1;
  const total = Object.values(devTally).reduce((a, b) => a + b, 0);
  if (total % 10 === 0) {
    console.table(
      Object.fromEntries(Object.entries(devTally).map(([k, v]) => [k, `${v} (${((v / total) * 100).toFixed(0)}%)`]))
    );
  }
}

/* ── One roulette slot. Reads its own screen position off the shared
   stripX motion value so dimming near the indicator costs zero re-renders. ── */
function RouletteCard({
  item,
  slotCenterX,
  containerWidth,
  stripX,
  itemWidth,
  isTarget,
}: {
  item: CaseItem;
  slotCenterX: number;
  containerWidth: number;
  stripX: ReturnType<typeof useMotionValue<number>>;
  itemWidth: number;
  isTarget: boolean;
}) {
  const rarity = RARITIES[item.rarity];
  const opacity = useTransform(stripX, (x) => {
    const screenX = slotCenterX + x;
    return Math.abs(screenX - containerWidth / 2) < itemWidth * 1.5 ? 1 : 0.75;
  });
  const Icon = item.icon;

  return (
    <motion.div
      className="relative flex h-full flex-col items-center justify-center gap-2 overflow-hidden"
      style={{
        width: itemWidth,
        minWidth: itemWidth,
        opacity,
        background: `linear-gradient(180deg, #0F0F1A 0%, ${rarity.color}14 100%)`,
        borderRight: "1px solid rgba(255,255,255,0.04)",
        borderBottom: `3px solid ${rarity.color}`,
      }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-lg border"
        style={{
          borderColor: isTarget ? `${rarity.color}88` : "rgba(255,255,255,0.06)",
          background: isTarget ? `${rarity.color}22` : "rgba(255,255,255,0.02)",
        }}
      >
        <Icon size={20} strokeWidth={1.5} style={{ color: isTarget ? rarity.color : "rgba(255,255,255,0.35)" }} />
      </div>
      <span className="px-1 text-center text-[10px] font-medium leading-tight text-white/70">{item.label}</span>
    </motion.div>
  );
}

interface CaseOpeningProps {
  isOpen: boolean;
  onClose: () => void;
  /** "resume" | "cv" open the shared DocumentModal instead of navigating. */
  onOpenDocument: (type: "resume" | "cv") => void;
}

export default function CaseOpening({ isOpen, onClose, onOpenDocument }: CaseOpeningProps) {
  const router = useRouter();
  const { data: projects } = useSWR<ProjectSummary[]>(isOpen ? "/api/projects" : null, fetcher);
  const items = useMemo(() => buildCaseItems(projects ?? []), [projects]);

  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, getMobileServer);
  const itemWidth = isMobile ? 86 : 130;

  const [phase, setPhase] = useState<Phase>("IDLE");
  const [muted, setMutedState] = useState(readMuted);
  const [strip, setStrip] = useState<CaseItem[]>([]);
  const [winner, setWinner] = useState<CaseItem | null>(null);
  const [shaking, setShaking] = useState(false);
  const [goldSilhouette, setGoldSilhouette] = useState(false);
  const [flashes, setFlashes] = useState<number[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useCallbackRef(setContainerWidth);
  const audioRef = useRef<CaseAudio | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stripX = useMotionValue(0);
  const caseScale = useMotionValue(1);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  /* Base 3/4 viewing angle + mouse tilt, fed straight to the 3D box */
  const boxRotX = useTransform(tiltX, (v) => v - 16);
  const boxRotY = useTransform(tiltY, (v) => v + 24);

  useEffect(() => {
    audioRef.current = new CaseAudio();
    return () => {
      audioRef.current?.dispose();
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  /* Portal to <body>: the page's <main> has z-10 which traps a fixed
     child below the footer (z-30). Rendering into body escapes it. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  /* ── Reset whenever the modal (re)opens ── */
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setPhase("IDLE");
      setWinner(null);
      setShaking(false);
      setGoldSilhouette(false);
      setFlashes([]);
      stripX.jump(0);
      caseScale.set(1);
    }
  }

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    if (phase === "SPINNING") return;
    setPhase("CLOSED");
    clearTimeouts();
    setTimeout(() => onClose(), 250);
  }, [phase, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "SPINNING") handleDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, phase, handleDismiss]);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    persistMuted(next);
  };

  const triggerFlashes = (count: number) => {
    for (let i = 0; i < count; i++) {
      const id = Date.now() + i;
      const t = setTimeout(() => setFlashes((f) => [...f, id]), i * 220);
      timeoutsRef.current.push(t);
      const clear = setTimeout(() => setFlashes((f) => f.filter((x) => x !== id)), i * 220 + 220);
      timeoutsRef.current.push(clear);
    }
  };

  const fireRevealCeremony = useCallback((won: CaseItem) => {
    const rarity = RARITIES[won.rarity];
    audioRef.current?.reveal(won.rarity);
    if (rarity.shake) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 300);
      timeoutsRef.current.push(t);
    }
    if (rarity.edgeFlashes > 0) triggerFlashes(rarity.edgeFlashes);
    if (rarity.particleCount > 0) {
      confetti({
        particleCount: rarity.particleCount,
        colors: [rarity.color],
        spread: 75,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
        zIndex: 200,
      });
    }
    fetch("/api/case-open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: won.id, rarity: won.rarity }),
    }).catch(() => {});
  }, []);

  /* ── Crate tap: weighted pick + (non-reduced) anticipation squash → spin, or
     (reduced) straight 400ms crossfade to reveal. ── */
  const handleSpin = useCallback(() => {
    if (phase !== "IDLE" || items.length === 0) return;
    const won = pickWeighted(items);
    recordDevPick(won);
    setWinner(won);

    if (reducedMotion) {
      audioRef.current?.reveal(won.rarity);
      fetch("/api/case-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: won.id, rarity: won.rarity }),
      }).catch(() => {});
      setPhase("REVEAL");
      return;
    }

    const built: CaseItem[] = Array.from({ length: TOTAL_SLOTS }, (_, i) =>
      i === TARGET_INDEX ? won : pickWeighted(items)
    );
    setStrip(built);

    /* Anticipation squash → lid springs open (OPENING) → roulette */
    setPhase("OPENING");
    animate(caseScale, 0.94, {
      duration: 0.09,
      onComplete: () => {
        animate(caseScale, 1.03, { duration: 0.2 });
      },
    });
    const lockClick = setTimeout(() => audioRef.current?.tick(1), 120);
    timeoutsRef.current.push(lockClick);
    const openSound = setTimeout(() => audioRef.current?.landing(), LID_DELAY_S * 1000 + 150);
    timeoutsRef.current.push(openSound);
    const toSpin = setTimeout(() => setPhase("SPINNING"), OPENING_MS);
    timeoutsRef.current.push(toSpin);
  }, [phase, items, reducedMotion, caseScale]);

  /* ── Kick off the roulette once the strip has mounted and its width is known. ── */
  useEffect(() => {
    if (phase !== "SPINNING" || !winner || containerWidth === 0) return;

    const nearMissOffset = 8 + Math.random() * 22;
    const targetLeftEdge = TARGET_INDEX * itemWidth + nearMissOffset;
    const finalX = -(targetLeftEdge - containerWidth / 2);
    const distance = Math.abs(finalX);

    buildTickSchedule(distance, itemWidth, SPIN_DURATION_MS, SPIN_EASE).forEach(({ delay, pitchLift }) => {
      const t = setTimeout(() => audioRef.current?.tick(pitchLift), delay);
      timeoutsRef.current.push(t);
    });

    const controls = animate(stripX, finalX, {
      duration: SPIN_DURATION_MS / 1000,
      ease: SPIN_EASE,
      onComplete: () => {
        clearTimeouts();
        audioRef.current?.landing();
        const t = setTimeout(() => {
          setPhase("REVEAL");
          if (winner.rarity === "gold") {
            setGoldSilhouette(true);
            const t2 = setTimeout(() => {
              setGoldSilhouette(false);
              fireRevealCeremony(winner);
            }, 600);
            timeoutsRef.current.push(t2);
          } else {
            fireRevealCeremony(winner);
          }
        }, 350);
        timeoutsRef.current.push(t);
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, containerWidth]);

  const handleView = useCallback(() => {
    if (!winner) return;
    onClose();
    if (winner.route === "resume" || winner.route === "cv") onOpenDocument(winner.route);
    else router.push(winner.route);
  }, [winner, onClose, onOpenDocument, router]);

  const handleOpenAgain = () => {
    clearTimeouts();
    setPhase("IDLE");
    setWinner(null);
    setShaking(false);
    setGoldSilhouette(false);
    setFlashes([]);
    stripX.jump(0);
    caseScale.set(1);
  };

  const handleCaseMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    animate(tiltY, px * 12, { type: "spring", stiffness: 200, damping: 18 });
    animate(tiltX, -py * 12, { type: "spring", stiffness: 200, damping: 18 });
  };
  const resetTilt = () => {
    animate(tiltX, 0, { type: "spring", stiffness: 200, damping: 18 });
    animate(tiltY, 0, { type: "spring", stiffness: 200, damping: 18 });
  };

  const rarity = winner ? RARITIES[winner.rarity] : null;
  const WinnerIcon = winner?.icon;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && phase !== "CLOSED" && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Case Opening"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.2 : 0.3 }}
        >
          <div
            className="absolute inset-0 cursor-pointer bg-black/85 backdrop-blur-xl"
            onClick={phase !== "SPINNING" ? handleDismiss : undefined}
          />

          {/* ── Rarity edge flashes ── */}
          {flashes.map((id) => (
            <motion.div
              key={id}
              className="pointer-events-none fixed inset-0 z-[150]"
              style={{ background: rarity?.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.08, 0] }}
              transition={{ duration: 0.22 }}
            />
          ))}

          <motion.div
            className="relative z-10 w-full max-w-2xl"
            animate={shaking ? { x: [0, -3, 3, -3, 3, -1, 0], transition: { duration: 0.25 } } : { x: 0 }}
          >
            <motion.div
              className="relative w-full overflow-hidden rounded-2xl border"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "linear-gradient(180deg, #0F0F1A 0%, #050508 100%)",
                boxShadow: "0 30px 100px rgba(0,0,0,0.7)",
              }}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
                <motion.button
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/80"
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </motion.button>
                {phase !== "SPINNING" && (
                  <motion.button
                    onClick={handleDismiss}
                    aria-label="Close"
                    whileTap={{ scale: 0.95 }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/80"
                  >
                    <X size={14} strokeWidth={2} />
                  </motion.button>
                )}
              </div>

              <div className="relative p-8">
                {/* mode="sync" (default) — the outgoing phase's exit and the
                    incoming phase's enter run concurrently, so the 350ms
                    stillness beat before REVEAL isn't followed by an extra
                    blank gap from a sequential exit-then-enter. */}
                <AnimatePresence>
                  {(phase === "IDLE" || phase === "OPENING") && (
                    <motion.div
                      key="idle"
                      className="flex flex-col items-center gap-4"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.08 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/25">Secret Archive</span>

                      {/* 3D case stage — extra headroom so the lid can swing open without clipping */}
                      <div
                        className="relative flex items-end justify-center"
                        style={{ height: 270, width: CASE_W + 60, perspective: 1000 }}
                      >
                        {/* Pseudo-layer glow — opacity-only pulse, never box-shadow directly */}
                        <motion.div
                          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-3xl"
                          style={{ width: CASE_W, height: CASE_H, boxShadow: "0 0 60px 20px rgba(220,38,38,0.5)" }}
                          animate={
                            phase === "OPENING"
                              ? { opacity: 1 }
                              : reducedMotion
                                ? { opacity: 0.5 }
                                : { opacity: [0.35, 0.7, 0.35] }
                          }
                          transition={
                            phase === "OPENING"
                              ? { duration: 0.4 }
                              : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                          }
                        />

                        {/* Light beam bursting out of the opened case */}
                        <motion.div
                          aria-hidden
                          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                          style={{
                            bottom: CASE_H - 15,
                            width: 150,
                            height: 165,
                            transformOrigin: "bottom center",
                            background:
                              "linear-gradient(to top, rgba(220,38,38,0.55) 0%, rgba(220,38,38,0) 100%)",
                          }}
                          initial={false}
                          animate={
                            phase === "OPENING"
                              ? { opacity: 1, scaleY: 1 }
                              : { opacity: 0, scaleY: 0.2 }
                          }
                          transition={{
                            duration: 0.45,
                            ease: [0.22, 1, 0.36, 1],
                            delay: phase === "OPENING" ? LID_DELAY_S + 0.1 : 0,
                          }}
                        />

                        <motion.button
                          onClick={handleSpin}
                          disabled={phase !== "IDLE"}
                          onMouseMove={phase === "IDLE" ? handleCaseMouseMove : undefined}
                          onMouseLeave={resetTilt}
                          aria-label="Open the case"
                          className="relative block cursor-pointer disabled:cursor-default"
                          style={{ scale: caseScale }}
                          whileTap={phase === "IDLE" ? { scale: 0.95 } : undefined}
                        >
                          {/* The box: five faces + interior + hinged lid, true CSS 3D */}
                          <motion.div
                            className="relative"
                            style={{
                              width: CASE_W,
                              height: CASE_H,
                              transformStyle: "preserve-3d",
                              rotateX: boxRotX,
                              rotateY: boxRotY,
                            }}
                            animate={
                              reducedMotion || phase === "OPENING" ? { y: 0 } : { y: [0, -6, 0] }
                            }
                            transition={
                              phase === "IDLE" && !reducedMotion
                                ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                                : { duration: 0.3 }
                            }
                          >
                            {/* back */}
                            <div
                              className="absolute inset-0 border border-red-500/10"
                              style={{
                                transform: `rotateY(180deg) translateZ(${CASE_D / 2}px)`,
                                background: "#1c0608",
                              }}
                            />
                            {/* left */}
                            <div
                              className="absolute top-0 border border-red-500/10"
                              style={{
                                width: CASE_D,
                                height: CASE_H,
                                left: (CASE_W - CASE_D) / 2,
                                transform: `rotateY(-90deg) translateZ(${CASE_W / 2}px)`,
                                background: "linear-gradient(200deg, #4c0d10 0%, #1a0507 100%)",
                              }}
                            />
                            {/* right */}
                            <div
                              className="absolute top-0 border border-red-500/10"
                              style={{
                                width: CASE_D,
                                height: CASE_H,
                                left: (CASE_W - CASE_D) / 2,
                                transform: `rotateY(90deg) translateZ(${CASE_W / 2}px)`,
                                background: "linear-gradient(160deg, #581014 0%, #200608 100%)",
                              }}
                            />
                            {/* interior — red glow revealed when the lid opens */}
                            <div
                              className="absolute left-0"
                              style={{
                                width: CASE_W,
                                height: CASE_D,
                                top: (CASE_H - CASE_D) / 2,
                                transform: `rotateX(90deg) translateZ(${CASE_H / 2 - 8}px)`,
                                background:
                                  "radial-gradient(ellipse at center, rgba(248,113,113,0.95) 0%, rgba(153,27,27,0.5) 55%, #14040a 100%)",
                              }}
                            />
                            {/* front */}
                            <div
                              className="absolute inset-0 flex items-center justify-center border border-red-500/25"
                              style={{
                                transform: `translateZ(${CASE_D / 2}px)`,
                                background:
                                  "linear-gradient(160deg, #7f1d1d 0%, #3d0a0e 55%, #1a0608 100%)",
                              }}
                            >
                              <Package size={40} strokeWidth={1} className="text-white/60" />
                              {/* web-line detail */}
                              <div
                                className="absolute inset-x-0 bottom-3 mx-auto h-px w-4/5"
                                style={{
                                  background:
                                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                                }}
                              />
                              {/* ── Padlock: shackle pops open, then the lock drops away ── */}
                              <motion.div
                                className="absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center"
                                animate={
                                  phase === "OPENING"
                                    ? { opacity: 0, y: 30, rotate: 14 }
                                    : { opacity: 1, y: 0, rotate: 0 }
                                }
                                transition={
                                  phase === "OPENING"
                                    ? { delay: 0.28, duration: 0.3, ease: "easeIn" }
                                    : { duration: 0 }
                                }
                              >
                                <motion.div
                                  className="h-4 w-5 rounded-t-full border-2 border-b-0 border-zinc-300"
                                  style={{ transformOrigin: "bottom left" }}
                                  animate={{ rotate: phase === "OPENING" ? -60 : 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                />
                                <div
                                  className="flex h-6 w-7 items-center justify-center rounded-md"
                                  style={{
                                    background: "linear-gradient(180deg, #d4d4d8 0%, #71717a 100%)",
                                  }}
                                >
                                  <div className="h-2 w-1 rounded-full bg-zinc-800" />
                                </div>
                              </motion.div>
                            </div>
                            {/* lid — hinged at the back edge, springs open after the lock pops */}
                            <div
                              className="absolute left-0"
                              style={{
                                width: CASE_W,
                                height: CASE_D,
                                top: (CASE_H - CASE_D) / 2,
                                transformStyle: "preserve-3d",
                                transform: `rotateX(90deg) translateZ(${CASE_H / 2}px)`,
                              }}
                            >
                              <motion.div
                                className="absolute inset-0 flex items-center justify-center border border-red-500/20"
                                style={{
                                  transformOrigin: "top center",
                                  background:
                                    "linear-gradient(180deg, #991b1b 0%, #450a0a 100%)",
                                }}
                                animate={{ rotateX: phase === "OPENING" ? 112 : 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 120,
                                  damping: 11,
                                  delay: phase === "OPENING" ? LID_DELAY_S : 0,
                                }}
                              >
                                {/* portfolio logo — same mark as the favicon */}
                                <div
                                  className="flex h-11 w-11 items-center justify-center rounded-full border"
                                  style={{ borderColor: "#DC2626", background: "#050508" }}
                                >
                                  <span className="text-xl font-bold" style={{ color: "#DC2626" }}>
                                    S
                                  </span>
                                </div>
                                {/* latch on the front edge */}
                                <div
                                  className="absolute bottom-1 left-1/2 h-2 w-8 -translate-x-1/2 rounded-sm"
                                  style={{ background: "rgba(255,255,255,0.35)" }}
                                />
                              </motion.div>
                            </div>
                          </motion.div>
                        </motion.button>
                      </div>

                      <motion.span
                        className="text-sm font-medium uppercase tracking-[0.15em] text-white/40"
                        animate={reducedMotion ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {phase === "OPENING" ? "Opening…" : "Click to Open"}
                      </motion.span>
                    </motion.div>
                  )}

                  {phase === "SPINNING" && !reducedMotion && (
                    <motion.div
                      key="spinning"
                      className="flex flex-col items-center gap-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div
                        ref={containerRef}
                        className="relative w-full overflow-hidden rounded-xl border border-white/10"
                        style={{ height: "140px", background: "#060608" }}
                      >
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16" style={{ background: "linear-gradient(90deg,#060608,transparent)" }} />
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16" style={{ background: "linear-gradient(270deg,#060608,transparent)" }} />
                        <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-px -translate-x-1/2 bg-white/25" />
                        <div
                          className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2"
                          style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid rgba(255,255,255,0.6)" }}
                        />

                        {containerWidth > 0 && (
                          <motion.div className="absolute left-0 top-0 flex h-full items-center" style={{ x: stripX, willChange: "transform" }}>
                            {strip.map((item, i) => (
                              <RouletteCard
                                key={i}
                                item={item}
                                slotCenterX={i * itemWidth + itemWidth / 2}
                                containerWidth={containerWidth}
                                stripX={stripX}
                                itemWidth={itemWidth}
                                isTarget={i === TARGET_INDEX}
                              />
                            ))}
                          </motion.div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/20">Resolving…</span>
                    </motion.div>
                  )}

                  {phase === "REVEAL" && winner && rarity && (
                    <motion.div
                      key="reveal"
                      className="flex flex-col items-center gap-8 py-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0.4 : 0.5 }}
                    >
                      <motion.div
                        className="relative flex w-full max-w-xs flex-col items-center gap-4 overflow-hidden rounded-xl border p-8"
                        style={{
                          borderColor: `${rarity.color}55`,
                          borderBottomWidth: 4,
                          borderBottomColor: rarity.color,
                          background: `linear-gradient(180deg, #0F0F1A 0%, ${rarity.color}1f 100%)`,
                          boxShadow: goldSilhouette ? `0 0 80px 10px ${rarity.color}55` : `0 0 40px -5px ${rarity.color}40`,
                        }}
                        initial={reducedMotion ? false : { scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={reducedMotion ? { duration: 0.4 } : { type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-xl border"
                          style={{
                            borderColor: `${rarity.color}88`,
                            background: `${rarity.color}22`,
                            filter: goldSilhouette ? "brightness(0.3)" : "none",
                          }}
                        >
                          {WinnerIcon && <WinnerIcon size={28} strokeWidth={1.3} style={{ color: rarity.color }} />}
                        </div>
                        <div className="flex flex-col items-center gap-1" style={{ filter: goldSilhouette ? "brightness(0.3)" : "none" }}>
                          <span className="text-lg font-bold text-white">{winner.label}</span>
                          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: rarity.color }}>
                            {winner.rarity === "gold" ? `★ ${rarity.label} ★` : rarity.label}
                          </span>
                        </div>
                      </motion.div>

                      <div className="flex w-full max-w-xs flex-col gap-3">
                        <motion.button
                          onClick={handleView}
                          whileTap={{ scale: 0.95 }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
                        >
                          View {winner.label} <ArrowRight size={14} />
                        </motion.button>
                        <motion.button
                          onClick={handleOpenAgain}
                          whileTap={{ scale: 0.95 }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white"
                        >
                          <RotateCcw size={14} /> Open Again
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* Measures the roulette viewport as soon as it mounts (callback ref fires
   post-commit, unlike a plain ref read in the click handler). */
function useCallbackRef(onMount: (width: number) => void) {
  return useCallback(
    (node: HTMLDivElement | null) => {
      if (node) onMount(node.clientWidth);
    },
    [onMount]
  );
}
