"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { SMALL_CARTOON } from "@/lib/spiderman-assets";

const spidey = SMALL_CARTOON[0];

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[#050508] px-6 text-center">
      <Image src={spidey.src} alt="" width={spidey.w} height={spidey.h} className="h-auto w-40" priority />
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-white">404</h1>
        <p className="mt-2 text-sm text-white/50">This page swung off somewhere else.</p>
      </div>
      <Link href="/">
        <motion.span
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-xl transition-colors hover:border-red-500/50 hover:bg-white/10"
        >
          <Home size={16} /> Back Home
        </motion.span>
      </Link>
    </div>
  );
}
