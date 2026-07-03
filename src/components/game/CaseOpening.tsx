"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Box, RefreshCw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CS2 CASE OPENING GAME (REFINED)
   Features the initial Chest reveal, fixed overlay, and heavy 
   OutExpo friction curve for maximum dopamine.
   ═══════════════════════════════════════════════════════════════ */

interface CaseOpeningProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS = [
  "Resume", "CV", "Projects", "Education", "Experience", "Certificates", "Achievements",
];

const generateStrip = () => {
  const strip = [];
  for (let i = 0; i < 10; i++) {
    strip.push(...ITEMS);
  }
  strip.push("Classified Resume"); // The winning item
  strip.push(...ITEMS.slice(0, 5));
  return strip;
};

const STRIP_DATA = generateStrip();
const WIN_INDEX = STRIP_DATA.length - 6;
const ITEM_WIDTH = 140;

export default function CaseOpening({ isOpen, onClose }: CaseOpeningProps) {
  const [gameState, setGameState] = useState<"chest" | "spinning" | "revealed">("chest");
  const [result, setResult] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const startSpin = () => {
    setGameState("spinning");
    setResult(null);
    setIsFlashing(false);
  };

  const handleAnimationComplete = () => {
    if (gameState !== "spinning") return;
    setGameState("revealed");
    setResult(STRIP_DATA[WIN_INDEX]);
    
    // Trigger Screen Flash Reveal
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 500);
  };

  const resetGame = () => {
    setGameState("chest");
    setResult(null);
  };

  const spinOffset = -(WIN_INDEX * ITEM_WIDTH) + (ITEM_WIDTH * 1.5);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-2xl"
        >
          
          {/* Header Controls */}
          <div className="absolute top-0 left-0 w-full flex justify-between items-center p-8 z-50">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
              <span>System Vault</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={24} />
            </motion.button>
          </div>

          {/* Screen Flash Reveal */}
          <AnimatePresence>
            {isFlashing && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 z-[110] bg-white/40"
              />
            )}
          </AnimatePresence>

          <div className="relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* ── STATE 1: INITIAL CHEST ── */}
              {gameState === "chest" && (
                <motion.div
                  key="chest"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-8"
                >
                  <div className="relative flex h-48 w-48 items-center justify-center rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                    <Box size={64} className="text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(220,38,38,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startSpin}
                    className="rounded-full bg-red-600 px-12 py-4 text-sm font-black uppercase tracking-[0.3em] text-white transition-colors hover:bg-red-500"
                  >
                    Click to Open
                  </motion.button>
                </motion.div>
              )}

              {/* ── STATE 2 & 3: SPINNING / REVEALED ROULETTE ── */}
              {(gameState === "spinning" || gameState === "revealed") && (
                <motion.div
                  key="roulette"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center w-full"
                >
                  
                  {/* Top Indicator */}
                  <div className="relative z-20 mb-[-10px] flex flex-col items-center text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                    <div className="h-6 w-0.5 bg-red-500" />
                    <div className="h-3 w-3 rotate-45 border-b-2 border-r-2 border-red-500 bg-black translate-y-[-6px]" />
                  </div>

                  {/* Strip Container */}
                  <div className="relative h-32 w-full max-w-2xl overflow-hidden rounded-xl border-x-2 border-red-600/50 bg-zinc-950/80 shadow-[0_0_30px_rgba(220,38,38,0.15)] shadow-inner">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black/80 to-transparent" />
                    <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-[2px] -translate-x-1/2 bg-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />

                    <motion.div
                      className="flex h-full items-center"
                      initial={{ x: 0 }}
                      animate={{ x: spinOffset }}
                      transition={{
                        duration: 6,
                        ease: [0.15, 1, 0.3, 1], // OutExpo friction curve
                      }}
                      onAnimationComplete={handleAnimationComplete}
                      style={{ width: `${STRIP_DATA.length * ITEM_WIDTH}px` }}
                    >
                      {STRIP_DATA.map((item, i) => (
                        <div
                          key={i}
                          className="flex h-24 w-[140px] shrink-0 items-center justify-center border-r border-white/5 bg-gradient-to-b from-white/5 to-transparent px-2"
                          style={{ width: ITEM_WIDTH }}
                        >
                          <div className={`flex h-full w-full flex-col items-center justify-center rounded-lg border px-2 text-center transition-colors ${
                            gameState === "revealed" && i === WIN_INDEX 
                              ? "border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(220,38,38,0.3)]" 
                              : "border-white/10 bg-black/40"
                          }`}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${
                              gameState === "revealed" && i === WIN_INDEX ? "text-red-400" : "text-zinc-500"
                            }`}>
                              {item}
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Bottom Indicator */}
                  <div className="relative z-20 mt-[-10px] flex flex-col items-center text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                    <div className="h-3 w-3 rotate-45 border-l-2 border-t-2 border-red-500 bg-black translate-y-[6px]" />
                    <div className="h-6 w-0.5 bg-red-500" />
                  </div>

                  {/* Revealed Actions */}
                  <div className="mt-12 h-24 flex items-center justify-center">
                    <AnimatePresence>
                      {gameState === "revealed" && result && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <motion.button
                              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.4)" }}
                              whileTap={{ scale: 0.95 }}
                              className="rounded-xl border border-white/20 bg-white px-10 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-zinc-200"
                            >
                              View {result}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={resetGame}
                              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3.5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                              title="Open Again"
                            >
                              <RefreshCw size={20} />
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
