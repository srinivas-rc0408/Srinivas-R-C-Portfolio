"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Car, Bus, Bike } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// CRITICAL: Dynamic import with ssr: false to prevent window is not defined error
const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), { ssr: false });

type Vehicle = "motorcycle" | "car" | "bus";

export default function GamePage() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [popupData, setPopupData] = useState<{ stopName: string; slug: string } | null>(null);
  const [gameEnabled, setGameEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        if (data.gameEnabled === false) setGameEnabled(false);
      })
      .catch(() => {});

    const handleBusStop = (e: Event) => {
      const customEvent = e as CustomEvent;
      setPopupData(customEvent.detail);
    };

    window.addEventListener("busStopEntered", handleBusStop);
    return () => window.removeEventListener("busStopEntered", handleBusStop);
  }, []);

  // Clear popup when moving away
  useEffect(() => {
    if (popupData) {
      const timer = setTimeout(() => {
        setPopupData(null);
      }, 5000); // Auto hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [popupData]);

  if (!gameEnabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 z-50 relative">
        <Link href="/" className="absolute top-6 left-6 text-text-muted hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft size={20} /> Back to Hub
        </Link>
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
          <Car size={40} className="text-text-muted" />
        </div>
        <h1 className="font-space text-4xl font-bold mb-4 text-center text-white">Game Mode Disabled</h1>
        <p className="text-text-muted text-center max-w-md">
          The 3D portfolio navigation map is currently offline for maintenance. Please use the standard browser.
        </p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 z-50 relative">
        <Link href="/" className="absolute top-6 left-6 text-text-muted hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft size={20} /> Back to Hub
        </Link>
        
        <h1 className="font-space text-4xl md:text-5xl font-bold mb-2 text-center text-white">Choose Your Vehicle</h1>
        <p className="text-text-muted mb-12 text-center max-w-md">
          Explore the portfolio map. Each vehicle has different physics handling.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            { id: "motorcycle", name: "Motorcycle", icon: Bike, desc: "High speed, fast acceleration, slippery." },
            { id: "car", name: "Car", icon: Car, desc: "Balanced speed and handling." },
            { id: "bus", name: "Bus", icon: Bus, desc: "Slow, heavy, wide turning radius." }
          ].map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setVehicle(v.id as Vehicle)}
                className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] hover:border-accent/40 hover:shadow-[0_0_30px_rgba(108,99,255,0.12)] p-8 rounded-2xl flex flex-col items-center transition-all duration-300 hover:-translate-y-2 group min-h-[44px]"
              >
                <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mb-6 border border-white/5 group-hover:shadow-[0_0_20px_rgba(108,99,255,0.4)]">
                  <Icon size={40} className="text-white group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-space text-2xl font-bold mb-2 text-white">{v.name}</h3>
                <p className="text-text-muted text-sm text-center">{v.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Phaser Game Engine */}
      <GameCanvas vehicleType={vehicle} />

      {/* HUD Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        <div className="p-6">
          <Link href="/" className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-full text-text-main hover:bg-white/[0.1] hover:text-white transition-all duration-300 shadow-lg min-h-[44px]">
            <ArrowLeft size={16} /> Exit Game
          </Link>
        </div>

        {/* Bus Stop Popup overlay */}
        <div className="p-6 flex justify-center mb-10">
          <AnimatePresence>
            {popupData && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="pointer-events-auto w-full max-w-sm bg-surface/90 backdrop-blur-md border border-accent/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col items-center text-center"
              >
                <div className="w-12 h-1 bg-accent/50 rounded-full mb-4" />
                <h3 className="font-space text-2xl font-bold text-white mb-2">
                  {popupData.stopName}
                </h3>
                <p className="text-text-muted text-sm mb-6">
                  You have discovered the {popupData.stopName} sector. Park here to explore deeper.
                </p>
                <Link
                  href={`/section/${popupData.slug}`}
                  className="w-full py-3 bg-accent hover:bg-accent/80 text-white font-medium rounded-xl transition-colors text-center block min-h-[44px] flex items-center justify-center"
                >
                  View Full Section
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
