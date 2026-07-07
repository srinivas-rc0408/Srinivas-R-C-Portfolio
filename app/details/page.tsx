"use client";

import { useState, useEffect } from "react";
import DynamicSection from "@/src/components/DynamicSection";
import Certifications from "@/src/components/sections/Certifications";
import { Loader2, ArrowLeft, MapPin, Check } from "lucide-react";
import { useScrollStore } from "@/src/contexts/ScrollStore";
import Link from "next/link";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   DETAILS PAGE (/details)
   The unified Single-Page Scrollway containing Education, Experience,
   Achievements, and the Certifications Matrix.
   ═══════════════════════════════════════════════════════════════ */

interface SectionItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  link: string;
}

interface Section {
  id: string;
  title: string;
  items: SectionItem[];
}

export default function DetailsPage() {
  const [dynamicSections, setDynamicSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setActiveSection } = useScrollStore();

  // Fetch dynamic sections
  useEffect(() => {
    fetch("/api/sections")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDynamicSections(data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Scroll-Spy Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [dynamicSections, setActiveSection]);

  return (
    <main className="min-h-screen w-full bg-[#050508] pb-32">
      {/* Background styling */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-[#050508] to-[#050508]" />
      
      {/* ── FLOATING HEADER — offset below the fixed global navbar (~72px) ── */}
      <header className="mt-[72px] sticky top-[72px] z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          
          <div className="flex items-center gap-6">
            {/* The Side Menu Trigger logic is handled globally by MainLayout's Navbar. 
                But if we needed a specific trigger here, we'd add it. 
                For now, the global navbar sits on top, but assuming this header overrides or complements it. */}
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-widest text-white">Srinivas R.C</h1>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500">
                <MapPin size={10} /> Bengaluru, Karnataka
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:text-white"
              >
                <ArrowLeft size={16} /> Home
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex w-full flex-col items-center pt-16">
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex w-full items-center justify-center py-32 text-red-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && dynamicSections.length === 0 && (
          <div className="flex w-full flex-col items-center justify-center py-32 px-6 text-center border-y border-white/5 bg-white/[0.01]">
            <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">No sections found.</p>
            <p className="text-zinc-600 text-xs mt-2">Log into the Admin_OS to create sections.</p>
          </div>
        )}

        {/* Render Dynamic Sections */}
        {dynamicSections.map((section) => (
          <DynamicSection key={section.id} data={section} />
        ))}

        {/* MOCK HARDCODED SECTIONS TO MATCH SIDE MENU ID'S FOR PROOF OF CONCEPT */}
        <section id="experience" className="relative z-20 flex w-full flex-col items-center justify-center py-24 px-6 md:px-12">
          <div className="w-full max-w-5xl flex flex-col gap-12">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white md:text-6xl border-b border-white/10 pb-4">Experience</h2>
            <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-zinc-400">Software Engineer @ Tech Solutions (2021 - Present)</div>
          </div>
        </section>

        <section id="education" className="relative z-20 flex w-full flex-col items-center justify-center py-24 px-6 md:px-12">
          <div className="w-full max-w-5xl flex flex-col gap-12">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white md:text-6xl border-b border-white/10 pb-4">Education</h2>
            <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-zinc-400">B.Tech in Computer Science from Visvesvaraya Technological University (VTU).</div>
          </div>
        </section>

        {/* ── CHRONOLOGICAL CERTIFICATIONS MATRIX ── */}
        <Certifications />

      </div>

      {/* ── PERSISTENT DONE BUTTON ── */}
      <motion.div 
        className="fixed bottom-8 right-8 z-[100]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(220,38,38,0.4)" }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-2xl bg-red-600 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_40px_-10px_rgba(220,38,38,0.8)] transition-colors hover:bg-red-500"
          >
            <Check size={20} strokeWidth={3} />
            Done
          </motion.button>
        </Link>
      </motion.div>

    </main>
  );
}
