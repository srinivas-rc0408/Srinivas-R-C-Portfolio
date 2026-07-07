"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Car, Zap, X } from "lucide-react";

// Dynamically import the Phaser games to prevent SSR execution —
// Phaser relies on the Canvas API which is only available in the browser
const PortfolioGame = dynamic(() => import("@/src/components/game/PortfolioGame"), {
  ssr: false,
});
const GeometryDash = dynamic(() => import("@/src/components/game/GeometryDash"), {
  ssr: false,
});

/* ═══════════════════════════════════════════════════════════════
   GAME ROUTE (/game) — Interactive Mode
   Pick a game: Web Drive (open-world driving) or Spidey Dash
   (one-touch runner). Each game hosts its own Phaser canvas.
   ═══════════════════════════════════════════════════════════════ */

type Mode = "drive" | "dash" | null;

const GAMES: { mode: Exclude<Mode, null>; icon: typeof Car; title: string; blurb: string }[] = [
  {
    mode: "drive",
    icon: Car,
    title: "Web Drive",
    blurb: "Cruise the city and discover my work at every stop.",
  },
  {
    mode: "dash",
    icon: Zap,
    title: "Spidey Dash",
    blurb: "One-touch runner. Jump the spikes — how far can you go?",
  },
];

export default function GamePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);

  return (
    <main className="fixed inset-0 z-[100] bg-black">
      {mode === "drive" && <PortfolioGame />}
      {mode === "dash" && <GeometryDash onExit={() => setMode(null)} />}

      {mode === null && (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-10 bg-[#050508] px-6 text-center">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            aria-label="Back to portfolio"
            className="absolute right-8 top-8 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-colors hover:bg-red-500"
          >
            <X size={24} strokeWidth={3} />
          </motion.button>

          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-white">Interactive Mode</h1>
            <p className="mt-2 text-sm text-zinc-500">Pick a game.</p>
          </div>

          <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
            {GAMES.map(({ mode: m, icon: Icon, title, blurb }) => (
              <motion.button
                key={m}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(m)}
                className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-colors hover:border-red-500/50"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 text-red-500">
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs leading-relaxed text-zinc-500">{blurb}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
