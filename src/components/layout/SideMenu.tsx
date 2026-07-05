"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { X, Folder, ChevronDown, Terminal, GraduationCap, Briefcase, Award, FileText, Check } from "lucide-react";
import { useScrollStore } from "@/src/contexts/ScrollStore";
import DocumentModal from "@/src/components/modals/DocumentModal";

/* ═══════════════════════════════════════════════════════════════
   SIDE MENU (AAA LAYOUT)
   Heavy spring physics, backdrop-blur-2xl, staggered load,
   and cinematic scrollbar fade-out.
   ═══════════════════════════════════════════════════════════════ */

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuVariants: Variants = {
  hidden: { x: "-100%", transition: { ease: [0.22, 1, 0.36, 1], duration: 0.5 } },
  visible: { x: "0%", transition: { ease: [0.22, 1, 0.36, 1], duration: 0.6, staggerChildren: 0.1, delayChildren: 0.2 } },
  exit: { x: "-100%", transition: { ease: [0.22, 1, 0.36, 1], duration: 0.5 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [docType, setDocType] = useState<"resume" | "cv" | null>(null);
  const [visited, setVisited] = useState<Record<string, boolean>>({
    "neuroforge": true,
  });

  const openDocument = (type: "resume" | "cv") => {
    setDocType(type);
    onClose();
  };
  
  const { activeSection } = useScrollStore();

  const markVisited = (id: string) => {
    setVisited(prev => ({ ...prev, [id]: true }));
    onClose();
  };

  return (
    <>
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
          />

          {/* ── Sliding Panel ── */}
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 left-0 h-full w-80 bg-[#0a0a0c]/95 border-r border-red-900/30 z-50 shadow-[20px_0_50px_rgba(0,0,0,0.7)] flex flex-col"
          >
            {/* Header: Close Button */}
            <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/5">
              <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">System Nav</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Menu Items (Staggered & Masked) */}
            <div 
              className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden pr-2 px-6 py-8 flex flex-col gap-6"
              style={{ maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)' }}
            >
              
              {/* Pinned Items */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <Link
                  href="/details"
                  onClick={onClose}
                  className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold tracking-wide text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Terminal size={16} />
                  ⭐ Portfolio Details
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="h-[1px] w-full shrink-0 bg-white/5" />

              {/* Folder: Projects */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <button
                  onClick={() => setProjectsExpanded(!projectsExpanded)}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <Folder size={16} className={projectsExpanded ? "text-red-400" : "text-zinc-500"} />
                    Projects
                  </div>
                  <motion.div animate={{ rotate: projectsExpanded ? 180 : 0 }}>
                    <ChevronDown size={14} className="text-zinc-500" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {projectsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden flex flex-col gap-1 pl-9 pr-2 mt-1"
                    >
                      <ProjectLink id="neuroforge" label="NeuroForge Engine" visited={!!visited["neuroforge"]} isActive={activeSection === "neuroforge"} onClick={() => markVisited("neuroforge")} />
                      <ProjectLink id="portfoliov2" label="Portfolio V2 Shell" visited={!!visited["portfoliov2"]} isActive={activeSection === "portfoliov2"} onClick={() => markVisited("portfoliov2")} />
                      <ProjectLink id="archagent" label="ArchAgent AI" visited={!!visited["archagent"]} isActive={activeSection === "archagent"} onClick={() => markVisited("archagent")} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={itemVariants} className="h-[1px] w-full shrink-0 bg-white/5" />

              {/* Links: Education, Certifications, Experience */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Quick Links</div>
                <MenuLink href="/details#experience" icon={<Briefcase size={16} />} label="Experience" isActive={activeSection === "experience"} onClick={onClose} />
                <MenuLink href="/details#education" icon={<GraduationCap size={16} />} label="Education" isActive={activeSection === "education"} onClick={onClose} />
                <MenuLink href="/details#certifications" icon={<Award size={16} />} label="Certifications" isActive={activeSection === "certifications"} onClick={onClose} />
              </motion.div>

              <motion.div variants={itemVariants} className="h-[1px] w-full shrink-0 bg-white/5" />

              {/* Links: Resume, CV */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2 pb-12">
                <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Documents</div>
                <MenuButton icon={<FileText size={16} />} label="Resume" onClick={() => openDocument("resume")} />
                <MenuButton icon={<FileText size={16} />} label="Curriculum Vitae" onClick={() => openDocument("cv")} />
              </motion.div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <DocumentModal isOpen={!!docType} onClose={() => setDocType(null)} type={docType ?? "resume"} />
    </>
  );
}

/* ── HELPERS ── */
function MenuLink({ href, icon, label, className = "", isActive, onClick }: { href: string; icon: React.ReactNode; label: string; className?: string; isActive: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10 ${
        isActive ? "bg-red-500/10 text-red-400" : className || "text-zinc-400 hover:text-zinc-100"
      }`}
    >
      <span className={isActive ? "text-red-400" : "text-zinc-500"}>{icon}</span>
      {label}
    </Link>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      <span className="text-zinc-500">{icon}</span>
      {label}
    </button>
  );
}

function ProjectLink({ id, label, visited, isActive, onClick }: { id: string; label: string; visited: boolean; isActive: boolean; onClick: () => void }) {
  return (
    <Link
      href={`/details#${id}`}
      onClick={onClick}
      className={`flex items-center justify-between rounded-md py-2 px-3 text-xs font-medium transition-colors hover:bg-white/5 hover:text-zinc-300 ${
        isActive ? "bg-red-500/10 text-red-400" : "text-zinc-500"
      }`}
    >
      <span className="truncate">{label}</span>
      {visited && !isActive && <Check size={12} className="text-emerald-500 shrink-0" />}
      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
    </Link>
  );
}
