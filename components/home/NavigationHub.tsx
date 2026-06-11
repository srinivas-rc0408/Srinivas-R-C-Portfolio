"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Dices, LayoutGrid } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function NavigationHub() {
  const [config, setConfig] = useState({ gameEnabled: true, gambleEnabled: true });

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {});
  }, []);

  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="nav-hub" className="py-20 px-4 max-w-6xl mx-auto relative z-10">
      <motion.div 
        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {config.gameEnabled ? (
          <Link href="/game" className="group focus:outline-none focus:ring-2 focus:ring-accent rounded-2xl" tabIndex={0}>
            <div className="bg-surface/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 h-full flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:border-accent/50 hover:bg-surface">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-space text-2xl font-bold mb-2">Game Mode</h3>
              <p className="text-text-muted">Drive through the city to discover my portfolio sections.</p>
            </div>
          </Link>
        ) : (
          <div className="bg-surface/30 backdrop-blur-sm border border-white/5 rounded-2xl p-8 h-full flex flex-col items-center text-center opacity-50 cursor-not-allowed">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Gamepad2 className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="font-space text-2xl font-bold mb-2 text-text-muted">Game Mode</h3>
            <p className="text-text-muted text-sm uppercase tracking-wider font-bold mt-2">Temporarily Disabled</p>
          </div>
        )}

        {config.gambleEnabled ? (
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openGambleModal'))} 
            className="group w-full text-left focus:outline-none focus:ring-2 focus:ring-secondary rounded-2xl"
            tabIndex={0}
          >
            <div className="bg-surface/50 backdrop-blur-sm border border-secondary/40 rounded-2xl p-8 h-full flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:bg-surface relative overflow-hidden">
              <div className="absolute inset-0 border-2 border-secondary rounded-2xl animate-pulse opacity-50"></div>
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Dices className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-space text-2xl font-bold mb-2">Gamble Mode</h3>
              <p className="text-text-muted">Feeling lucky? Let fate decide which section you view next.</p>
            </div>
          </button>
        ) : (
          <div className="bg-surface/30 backdrop-blur-sm border border-white/5 rounded-2xl p-8 h-full flex flex-col items-center text-center opacity-50 cursor-not-allowed">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Dices className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="font-space text-2xl font-bold mb-2 text-text-muted">Gamble Mode</h3>
            <p className="text-text-muted text-sm uppercase tracking-wider font-bold mt-2">Temporarily Disabled</p>
          </div>
        )}

        <Link href="/sections" className="group focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl" tabIndex={0}>
          <div className="bg-surface/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 h-full flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:bg-surface">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-8 h-8 text-text-main" />
            </div>
            <h3 className="font-space text-2xl font-bold mb-2">Browse All</h3>
            <p className="text-text-muted">View all sections in a standard, clean grid layout.</p>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
