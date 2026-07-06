"use client";

import dynamic from "next/dynamic";

// Dynamically import the Phaser game to prevent SSR execution
// Phaser relies on the Canvas API which is only available in the browser
const PortfolioGame = dynamic(() => import("@/src/components/game/PortfolioGame"), {
  ssr: false,
});

/* ═══════════════════════════════════════════════════════════════
   GAME ROUTE (/game)
   The full-screen container that hosts the Phaser Canvas. Exit
   (with trip-summary confirmation) lives inside PortfolioGame itself.
   ═══════════════════════════════════════════════════════════════ */

export default function GamePage() {
  return (
    <main className="fixed inset-0 z-[100] bg-black">
      <PortfolioGame />
    </main>
  );
}
