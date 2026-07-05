"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Zap, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import SignInModal from "@/src/components/auth/SignInModal";
import { useAuth } from "@/src/hooks/useAuth";

/* ═══════════════════════════════════════════════════════════════
   NAVBAR (AAA LAYOUT)
   Top-level persistent shell. Features glassmorphism, redundant 
   Home navigation, and magnetic triggers.
   ═══════════════════════════════════════════════════════════════ */

interface NavbarProps {
  onMenuTrigger: () => void;
}

export default function Navbar({ onMenuTrigger }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const { displayName } = useAuth();
  const firstName = displayName?.split(" ")[0];

  const showBackButton = pathname !== "/";

  return (
    <>
      <nav className="fixed top-0 inset-x-0 w-full z-[80] px-8 py-4 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/10 transition-colors">
        
        {/* ── Left: Navigation Cluster ── */}
        <div className="flex-1 flex justify-start items-center gap-4">
          
          {/* Dynamic Back Button */}
          {showBackButton && (
            <motion.button
              onClick={() => router.back()}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 rounded-full px-4 py-2 border border-white/10 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-white/20"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </motion.button>
          )}

          {/* Menu Trigger (Lightning S) */}
          <motion.button
            onClick={onMenuTrigger}
            whileHover={{ scale: 1.1, textShadow: "0 0 8px rgba(255,255,255,0.8)" }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] bg-white/5 hover:bg-white/10"
          >
            <div className="relative flex items-center justify-center text-red-500">
              <Zap size={20} className="absolute -left-2 text-yellow-500 opacity-80" />
              <span className="font-black text-xl italic tracking-tighter">S</span>
            </div>
          </motion.button>

          {/* NEW Home Button */}
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center p-2 rounded-xl text-white/60 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-300"
            >
              <Home size={18} />
            </motion.button>
          </Link>

        </div>

        {/* ── Center: Brand Name (Silent Return-to-Home) ── */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="group">
            <span 
              className="text-sm md:text-base font-bold tracking-[0.3em] text-white uppercase transition-all duration-500 group-hover:tracking-[0.4em] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
            >
              SRINIVAS R.C
            </span>
          </Link>
        </div>

        {/* ── Right: Sign In Gateway ── */}
        <div className="flex-1 flex justify-end">
          <motion.button
            onClick={() => setIsSignInOpen(true)}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-white hover:text-black shadow-lg"
          >
            <User size={14} />
            <span className="hidden sm:inline">{firstName || "Sign In"}</span>
          </motion.button>
        </div>
        
      </nav>

      {/* ── Authentication Modal ── */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </>
  );
}
