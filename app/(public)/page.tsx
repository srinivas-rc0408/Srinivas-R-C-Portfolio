"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, FormEvent } from "react";
import HeroSection from "@/components/home/HeroSection";
import NavigationHub from "@/components/home/NavigationHub";
import { ArrowRight } from "lucide-react";

const ParticleBackground = dynamic(() => import("@/components/backgrounds/ParticleBackground"), { ssr: false });
const GambleModal = dynamic(() => import("@/components/home/GambleModal"), { ssr: false });

export default function Home() {
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("guestName");
    // If not logged in and no guest name, show prompt
    if (!storedName) {
      setShowGuestPrompt(true);
    }
  }, []);

  const handleGuestLogin = (e: FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      localStorage.setItem("guestName", guestName.trim());
      setShowGuestPrompt(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col">
      <ParticleBackground />
      
      <HeroSection />
      <NavigationHub />
      <GambleModal />

      {/* Guest Login Prompt - Sticky Bottom Bar */}
      <div 
        className={`fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur border-t border-accent/20 transform transition-transform duration-500 z-40 ${
          showGuestPrompt ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-space font-medium text-lg flex-shrink-0">
            Enter your name to browse
          </p>
          <form onSubmit={handleGuestLogin} className="flex w-full sm:w-auto gap-2">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest Name..."
              className="bg-background border border-white/10 rounded-full px-6 py-2 flex-grow focus:outline-none focus:border-accent"
              required
            />
            <button 
              type="submit"
              className="bg-accent rounded-full p-2 hover:bg-accent/80 transition-colors w-11 h-11 flex items-center justify-center flex-shrink-0"
              aria-label="Submit guest name"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
