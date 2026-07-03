"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Package,
  FileText,
  FolderKanban,
  Bot,
  ScrollText,
  X,
  ArrowRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

type Phase = "IDLE" | "SPINNING" | "REVEAL" | "CLOSED";

interface RouletteItem {
  id: string;
  icon: React.ElementType;
  label: string;
  isTarget?: boolean;
}

/**
 * Roulette items — each `id` becomes the dynamic route segment.
 * Icons are lightweight SVGs (Lucide) for GPU-friendly animation.
 */
const ROULETTE_ITEMS: RouletteItem[] = [
  { id: "resume", icon: FileText, label: "Resume" },
  { id: "projects", icon: FolderKanban, label: "Projects" },
  { id: "archagent", icon: Bot, label: "ArchAgent" },
  { id: "ai_system", icon: ScrollText, label: "AI System" },
];

const ITEM_WIDTH = 120;
const TOTAL_SLOTS = 60;
const TARGET_INDEX = 52;

/** OutExpo: cubic-bezier(0.16, 1, 0.3, 1) */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function buildStrip(): { strip: RouletteItem[]; targetItem: RouletteItem } {
  const strip: RouletteItem[] = [];
  const target =
    ROULETTE_ITEMS[Math.floor(Math.random() * ROULETTE_ITEMS.length)];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    if (i === TARGET_INDEX) {
      strip.push({ ...target, isTarget: true });
    } else {
      strip.push({ ...ROULETTE_ITEMS[i % ROULETTE_ITEMS.length] });
    }
  }
  return { strip, targetItem: target };
}

/* ═══════════════════════════════════════════════════════════════
   AUDIO
   ═══════════════════════════════════════════════════════════════ */

function ensureAudio(ref: React.MutableRefObject<AudioContext | null>) {
  if (!ref.current) ref.current = new AudioContext();
  return ref.current;
}

function playTick(
  ref: React.MutableRefObject<AudioContext | null>,
  pitch: number
) {
  try {
    const ctx = ensureAudio(ref);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = pitch;
    osc.type = "square";
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.025);
  } catch {
    /* silent */
  }
}

function playThud(ref: React.MutableRefObject<AudioContext | null>) {
  try {
    const ctx = ensureAudio(ref);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 60;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* silent */
  }
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface CaseOpeningProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CaseOpening({ isOpen, onClose }: CaseOpeningProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("IDLE");
  const [{ strip, targetItem }] = useState(() => buildStrip());
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stripX = useMotionValue(0);

  /* ── Reset on open ── */
  useEffect(() => {
    if (isOpen) {
      setPhase("IDLE");
      setRewardId(null);
      setShaking(false);
      stripX.jump(0);
    }
    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [isOpen, stripX]);

  /* ── Esc key ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "SPINNING") handleDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, phase]);

  /* ── Lock body scroll ── */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── Prefetch reward page once we know the target ── */
  useEffect(() => {
    if (isOpen && targetItem) {
      router.prefetch(`/rewards/${targetItem.id}`);
    }
  }, [isOpen, targetItem, router]);

  /* ──────────────────────────────────────────────────────────
     PHYSICS ENGINE
     Phase 1: 2s linear (fast blur)
     Phase 2: 3s OutExpo (grinding halt)
     ────────────────────────────────────────────────────────── */
  const handleSpin = useCallback(() => {
    if (phase !== "IDLE") return;
    setPhase("SPINNING");

    const containerWidth = containerRef.current?.clientWidth ?? 500;
    const targetCenter = TARGET_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2;
    const finalX = -(targetCenter - containerWidth / 2);
    const midpointX = finalX * 0.65;

    let tickCount = 0;
    tickTimerRef.current = setInterval(() => {
      tickCount++;
      if (tickCount < 28) {
        playTick(audioRef, 1200 + Math.random() * 300);
      } else if (tickCount < 50 && tickCount % 2 === 0) {
        playTick(audioRef, 900 + Math.random() * 200);
      } else if (tickCount >= 50 && tickCount % 4 === 0) {
        playTick(audioRef, 600 + Math.random() * 150);
      }
      if (tickCount > 68) {
        if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      }
    }, 65);

    // Phase 1 → Phase 2
    animate(stripX, midpointX, {
      duration: 2,
      ease: "linear",
      onComplete: () => {
        animate(stripX, finalX, {
          duration: 3,
          ease: EASE_OUT_EXPO,
          onComplete: () => {
            if (tickTimerRef.current) clearInterval(tickTimerRef.current);

            // Thud + screen-shake
            setShaking(true);
            playThud(audioRef);
            setTimeout(() => setShaking(false), 300);

            // Store the rewardId
            setRewardId(strip[TARGET_INDEX].id);

            // Fade to reveal after thud settles
            setTimeout(() => setPhase("REVEAL"), 400);
          },
        });
      },
    });
  }, [phase, stripX, strip]);

  /* ── Dismiss ── */
  const handleDismiss = useCallback(() => {
    setPhase("CLOSED");
    setTimeout(() => onClose(), 250);
  }, [onClose]);

  /* ── Navigate to reward page ── */
  const handleContinue = useCallback(() => {
    if (!rewardId) return;
    // Close the modal, then navigate
    onClose();
    router.push(`/rewards/${rewardId}`);
  }, [rewardId, router, onClose]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <AnimatePresence>
      {isOpen && phase !== "CLOSED" && (
        <motion.div
          id="case-opening-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Secret Archive"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "linear" }}
        >
          {/* ── Backdrop ── */}
          <motion.div
            className="absolute inset-0"
            onClick={phase !== "SPINNING" ? handleDismiss : undefined}
            style={{
              cursor: phase !== "SPINNING" ? "pointer" : "default",
            }}
            initial={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
            animate={{
              background: phase === "REVEAL" ? "#000" : "rgba(0,0,0,0.8)",
              backdropFilter: "blur(12px)",
            }}
            exit={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
          />

          {/* ── Screen-shake wrapper ── */}
          <motion.div
            className="relative z-10 w-full max-w-2xl"
            animate={
              shaking
                ? {
                    x: [0, -3, 4, -2, 3, -1, 2, 0],
                    transition: { duration: 0.3, ease: "linear" },
                  }
                : { x: 0 }
            }
          >
            {/* ── Main Card ── */}
            <motion.div
              className="relative w-full overflow-hidden rounded-2xl border"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                borderColor:
                  phase === "REVEAL"
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.08)",
                background:
                  phase === "REVEAL"
                    ? "#000"
                    : "linear-gradient(180deg, rgba(10,10,14,0.99) 0%, rgba(4,4,6,1) 100%)",
                boxShadow:
                  phase === "REVEAL"
                    ? "0 40px 120px rgba(0,0,0,0.9)"
                    : "0 30px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              {/* ── Close (X) ── */}
              {phase !== "SPINNING" && (
                <motion.button
                  id="case-close-btn"
                  onClick={handleDismiss}
                  aria-label="Close"
                  className="absolute right-4 top-4 z-30 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/30 transition-colors duration-200 hover:text-white/70"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={14} strokeWidth={2} />
                </motion.button>
              )}

              {/* ── Content ── */}
              <div className="relative p-8">
                <AnimatePresence mode="wait">
                  {/* ═════════════════════════════════════════
                      IDLE — The Crate
                      ═════════════════════════════════════════ */}
                  {phase === "IDLE" && (
                    <motion.div
                      key="idle"
                      className="flex flex-col items-center gap-7"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className="text-[10px] font-semibold tracking-[0.3em] uppercase"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                          Secret Archive
                        </span>
                        <h2
                          className="text-xl font-semibold text-white/90"
                          style={{
                            fontFamily:
                              "'Georgia', 'Times New Roman', serif",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          Open the Vault
                        </h2>
                      </div>

                      {/* Crate — haptic pulse: scale 0.98 */}
                      <motion.button
                        id="crate-tap-trigger"
                        onClick={handleSpin}
                        className="group relative flex cursor-pointer flex-col items-center gap-4 rounded-xl border px-14 py-10"
                        style={{
                          borderColor: "rgba(255,255,255,0.06)",
                          background:
                            "linear-gradient(160deg, rgba(18,18,22,1) 0%, rgba(8,8,10,1) 100%)",
                        }}
                        animate={{
                          scale: [1, 1.02, 1],
                          borderColor: [
                            "rgba(255,255,255,0.06)",
                            "rgba(255,255,255,0.1)",
                            "rgba(255,255,255,0.06)",
                          ],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        whileHover={{
                          scale: 1.03,
                          borderColor: "rgba(255,255,255,0.14)",
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Package
                          size={52}
                          strokeWidth={1}
                          className="text-white/50 transition-colors duration-300 group-hover:text-white/80"
                        />
                        <span className="text-sm font-medium tracking-[0.15em] text-white/40 uppercase">
                          Tap to unlock
                        </span>
                      </motion.button>
                    </motion.div>
                  )}

                  {/* ═════════════════════════════════════════
                      SPINNING — The Roulette
                      ═════════════════════════════════════════ */}
                  {phase === "SPINNING" && (
                    <motion.div
                      key="spinning"
                      className="flex flex-col items-center gap-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span
                        className="text-[10px] font-medium tracking-[0.3em] uppercase"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        Resolving…
                      </span>

                      {/* Roulette viewport */}
                      <div
                        ref={containerRef}
                        className="relative w-full overflow-hidden rounded-xl border"
                        style={{
                          height: "130px",
                          borderColor: "rgba(255,255,255,0.06)",
                          background: "#060608",
                        }}
                      >
                        {/* Fade edges */}
                        <div
                          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20"
                          style={{
                            background:
                              "linear-gradient(90deg, #060608 0%, transparent 100%)",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20"
                          style={{
                            background:
                              "linear-gradient(270deg, #060608 0%, transparent 100%)",
                          }}
                        />

                        {/* Needle */}
                        <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-px -translate-x-1/2 bg-white/30" />
                        <div
                          className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: "6px solid transparent",
                            borderRight: "6px solid transparent",
                            borderTop: "7px solid rgba(255,255,255,0.5)",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: "6px solid transparent",
                            borderRight: "6px solid transparent",
                            borderBottom: "7px solid rgba(255,255,255,0.5)",
                          }}
                        />

                        {/* Strip — each slot shows icon + label */}
                        <motion.div
                          className="absolute left-0 top-0 flex h-full items-center"
                          style={{ x: stripX, willChange: "transform" }}
                        >
                          {strip.map((item, i) => {
                            const Icon = item.icon;
                            return (
                              <div
                                key={`${item.id}-${i}`}
                                className="flex h-full flex-col items-center justify-center gap-2 border-r"
                                style={{
                                  width: `${ITEM_WIDTH}px`,
                                  minWidth: `${ITEM_WIDTH}px`,
                                  borderColor: "rgba(255,255,255,0.03)",
                                }}
                              >
                                <div
                                  className="flex h-12 w-12 items-center justify-center rounded-lg border"
                                  style={{
                                    borderColor: item.isTarget
                                      ? "rgba(255,255,255,0.2)"
                                      : "rgba(255,255,255,0.04)",
                                    background: item.isTarget
                                      ? "rgba(255,255,255,0.04)"
                                      : "rgba(255,255,255,0.01)",
                                  }}
                                >
                                  <Icon
                                    size={22}
                                    strokeWidth={1.5}
                                    style={{
                                      color: item.isTarget
                                        ? "rgba(255,255,255,0.8)"
                                        : "rgba(255,255,255,0.2)",
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-[10px] font-medium"
                                  style={{
                                    color: item.isTarget
                                      ? "rgba(255,255,255,0.6)"
                                      : "rgba(255,255,255,0.15)",
                                  }}
                                >
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </motion.div>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.div
                          className="h-1 w-1 rounded-full bg-white/30"
                          animate={{ opacity: [0.2, 0.8, 0.2] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: "rgba(255,255,255,0.15)" }}
                        >
                          Determining outcome
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* ═════════════════════════════════════════
                      REVEAL — Obsidian result card
                      ═════════════════════════════════════════

                      Simple opacity fade — no bouncing, no scaling.
                      ═════════════════════════════════════════ */}
                  {phase === "REVEAL" && rewardId && (
                    <motion.div
                      key="reveal"
                      className="flex flex-col items-center gap-10 py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "linear" }}
                    >
                      {/* Top rule */}
                      <motion.div
                        className="h-px bg-white/15"
                        initial={{ width: 0 }}
                        animate={{ width: 48 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.2,
                          ease: EASE_OUT_EXPO,
                        }}
                      />

                      {/* Headline */}
                      <div className="flex flex-col items-center gap-3">
                        <motion.p
                          className="text-[11px] font-medium tracking-[0.35em] uppercase"
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          Access Granted
                        </motion.p>

                        <motion.h2
                          className="text-center text-2xl font-normal text-white md:text-3xl"
                          style={{
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                            letterSpacing: "-0.015em",
                            lineHeight: 1.3,
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.45 }}
                        >
                          Secret Archive Unlocked.
                        </motion.h2>
                      </div>

                      {/* Won item preview */}
                      <motion.div
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      >
                        {(() => {
                          const item = strip[TARGET_INDEX];
                          const Icon = item.icon;
                          return (
                            <>
                              <div
                                className="flex h-16 w-16 items-center justify-center rounded-xl border"
                                style={{
                                  borderColor: "rgba(255,255,255,0.08)",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                <Icon
                                  size={28}
                                  strokeWidth={1.2}
                                  className="text-white/70"
                                />
                              </div>
                              <span
                                className="text-sm font-medium"
                                style={{
                                  color: "rgba(255,255,255,0.5)",
                                  fontFamily:
                                    "'Georgia', 'Times New Roman', serif",
                                }}
                              >
                                {item.label}
                              </span>
                            </>
                          );
                        })()}
                      </motion.div>

                      {/* Bottom rule */}
                      <motion.div
                        className="h-px bg-white/[0.08]"
                        initial={{ width: 0 }}
                        animate={{ width: 48 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.9,
                          ease: EASE_OUT_EXPO,
                        }}
                      />

                      {/* CTA — high-contrast rectangular button */}
                      <motion.button
                        id="btn-continue-portfolio"
                        onClick={handleContinue}
                        className="group flex cursor-pointer items-center gap-3 px-10 py-4 text-sm uppercase"
                        style={{
                          background: "#fff",
                          color: "#000",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          fontFamily:
                            "var(--font-geist-sans), system-ui, sans-serif",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.1 }}
                        whileHover={{
                          scale: 1.02,
                          background: "rgba(255,255,255,0.88)",
                          backdropFilter: "blur(20px)",
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Continue
                        <ArrowRight
                          size={14}
                          strokeWidth={2.5}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
