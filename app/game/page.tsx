"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// Dynamically import the Phaser game to prevent SSR execution
// Phaser relies on the Canvas API which is only available in the browser
const PortfolioGame = dynamic(() => import("@/src/components/game/PortfolioGame"), {
  ssr: false,
});

/* ═══════════════════════════════════════════════════════════════
   GAME ROUTE (/game)
   The full-screen container that hosts the Phaser Canvas.
   ═══════════════════════════════════════════════════════════════ */

export default function GamePage() {
  return (
    <main className="fixed inset-0 z-[100] bg-black">
      {/* ── EXIT BUTTON ── */}
      <div className="absolute right-8 top-8 z-[110]">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-colors hover:bg-red-500"
          >
            <X size={24} strokeWidth={3} />
          </motion.button>
        </Link>
      </div>

      {/* ── PHASER GAME MOUNT ── */}
      <PortfolioGame />
    </main>
  );
}
