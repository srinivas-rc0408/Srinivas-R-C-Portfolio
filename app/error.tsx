"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[#050508] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-500">
        <AlertTriangle size={28} strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-white">Something Broke</h1>
        <p className="mt-2 text-sm text-white/50">An unexpected error occurred. It&apos;s been logged.</p>
      </div>
      <div className="flex gap-3">
        <motion.button
          onClick={reset}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-500"
        >
          <RotateCcw size={16} /> Try Again
        </motion.button>
        {/* Plain anchor, not next/link — forces a full reload so a broken
            client-router state doesn't follow us back to "/". */}
        <motion.a
          href="/"
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-xl transition-colors hover:border-red-500/50 hover:bg-white/10"
        >
          <Home size={16} /> Back Home
        </motion.a>
      </div>
    </div>
  );
}
