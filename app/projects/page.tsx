"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Search, GitBranch, Code2, Check, X } from "lucide-react";
import { useScrollStore } from "@/src/contexts/ScrollStore";

/* ═══════════════════════════════════════════════════════════════
   SEARCHABLE PROJECTS VAULT (/projects)
   A dedicated 3-column architectural view with real-time fuzzy
   search for all repository entries.
   ═══════════════════════════════════════════════════════════════ */

interface Project {
  id: string;
  title: string;
  description: string;
  githubUrl: string;
  tags: string[];
}

const MOCK_PROJECTS: Project[] = [
  {
    id: "neuroforge",
    title: "NeuroForge Engine",
    description: "Advanced AI Agent orchestration layer with dynamic sub-task delegation and complex state recovery.",
    githubUrl: "https://github.com/srinivas/neuroforge",
    tags: ["TypeScript", "Node.js", "AI"]
  },
  {
    id: "portfoliov2",
    title: "Portfolio V2 Shell",
    description: "Cinematic, glassmorphic portfolio architecture utilizing heavy framer-motion physics and SQLite.",
    githubUrl: "https://github.com/srinivas/portfolio-v2",
    tags: ["Next.js", "Framer Motion", "Tailwind"]
  },
  {
    id: "archagent",
    title: "ArchAgent AI",
    description: "LLM code generation system with deep integration for Claude 3.5 Sonnet and workspace analysis.",
    githubUrl: "https://github.com/srinivas/archagent",
    tags: ["Python", "React", "LLMs"]
  },
  {
    id: "quantum-router",
    title: "Quantum Router",
    description: "High-performance edge routing system built on Rust for sub-millisecond API proxying.",
    githubUrl: "https://github.com/srinivas/quantum-router",
    tags: ["Rust", "Networking"]
  },
  {
    id: "sentinel-auth",
    title: "Sentinel Auth",
    description: "Zero-trust authentication framework with hardware key integration and biometric fallback.",
    githubUrl: "https://github.com/srinivas/sentinel-auth",
    tags: ["Security", "Go", "WebAuthn"]
  }
];

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_PROJECTS;
    const query = searchQuery.toLowerCase();
    return MOCK_PROJECTS.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.tags.some(t => t.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <main className="min-h-screen w-full bg-[#050508] pb-32">
      {/* Background styling for consistency */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-[#050508] to-[#050508]" />
      
      <div className="relative z-10 flex w-full flex-col items-center">
        
        {/* ── HEADER ── */}
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-2xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-12">
            <div className="flex items-center gap-4">
              <Link href="/">
                <motion.button
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </motion.button>
              </Link>
              <h1 className="text-xl font-black uppercase tracking-widest text-white">Project Vault</h1>
            </div>
            
            <a href="https://github.com/srinivas" target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:text-white"
              >
                <GitBranch size={16} /> GitHub Profile
              </motion.button>
            </a>
          </div>
        </header>

        {/* ── SEARCH COMPONENT ── */}
        <div className="w-full max-w-4xl px-6 md:px-12 mt-16 mb-12">
          <div className="relative group w-full">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-red-500/30 to-red-900/30 opacity-0 blur transition duration-500 group-focus-within:opacity-100"></div>
            <div className="relative flex w-full items-center rounded-2xl border border-white/10 bg-zinc-900/80 px-6 py-4 backdrop-blur-md transition-colors focus-within:border-red-500/50">
              <Search className="text-zinc-500 transition-colors group-focus-within:text-red-500" size={24} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, keyword, or technology..."
                className="ml-4 w-full bg-transparent text-lg text-white placeholder-zinc-500 outline-none"
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearchQuery("")}
                  className="rounded-full bg-white/10 p-1 text-zinc-400 hover:bg-white/20 hover:text-white"
                >
                  <X size={16} />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* ── 3-COLUMN GRID LAYOUT ── */}
        <div className="w-full max-w-7xl px-6 md:px-12 min-h-[50vh]">
          <AnimatePresence mode="popLayout">
            {filteredProjects.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
              >
                {filteredProjects.map((project, index) => (
                  <motion.div
                    layout
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white/[0.04] hover:border-red-500/30 hover:shadow-[0_15px_30px_-10px_rgba(220,38,38,0.15)]"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                          <Code2 size={20} />
                        </div>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                          <ExternalLink size={20} />
                        </a>
                      </div>
                      
                      <h2 className="text-xl font-bold text-white tracking-wide mt-2">{project.title}</h2>
                      
                      {/* 1-2 line short description */}
                      <p className="text-sm leading-relaxed text-zinc-400 line-clamp-2">
                        {project.description}
                      </p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="rounded-full bg-white/5 p-6 mb-6">
                  <Search size={32} className="text-zinc-600" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">No Projects Found</h3>
                <p className="text-zinc-500 mt-2">Adjust your search query to find related repositories.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RETURN NAVIGATION ── */}
        <div className="mt-24 mb-12 flex justify-center w-full">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(220,38,38,0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-12 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-red-500"
            >
              <Check size={18} strokeWidth={3} />
              Done
            </motion.button>
          </Link>
        </div>

      </div>
    </main>
  );
}
