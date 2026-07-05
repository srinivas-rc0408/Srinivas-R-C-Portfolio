"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  FolderKanban,
  Bot,
  ScrollText,
  ArrowLeft,
  Terminal,
  Layers,
  Cpu,
  Lock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   REWARD CONTENT — Client Component
   Renders specific content based on the reward id.
   Full-screen, high-end display with grainy texture overlay
   and backdrop-blur "decoding" aesthetic.
   ═══════════════════════════════════════════════════════════════ */

interface RewardMeta {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  description: string;
}

const REWARD_MAP: Record<string, RewardMeta> = {
  resume: {
    icon: FileText,
    label: "Resume",
    subtitle: "Classified Document",
    description:
      "Full professional history, education credentials, and technical certifications — decoded from the archive.",
  },
  projects: {
    icon: FolderKanban,
    label: "Projects",
    subtitle: "Project Vault",
    description:
      "Complete catalog of production-grade systems, research experiments, and engineering case studies.",
  },
  archagent: {
    icon: Bot,
    label: "ArchAgent",
    subtitle: "Autonomous Architecture",
    description:
      "An advanced AI agent system designed for autonomous code generation, analysis, and architectural decision-making.",
  },
  ai_system: {
    icon: ScrollText,
    label: "AI System",
    subtitle: "Neural Interface",
    description:
      "A personalized AI system trained on custom data — capable of contextual reasoning and multi-modal interaction.",
  },
};

/** OutExpo curve */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function RewardContent({ id }: { id: string }) {
  const reward = REWARD_MAP[id];
  const [decoded, setDecoded] = useState(false);

  /* Simulate a brief "decoding" delay for visual effect */
  useEffect(() => {
    const timer = setTimeout(() => setDecoded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!reward) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Lock size={32} strokeWidth={1} className="text-white/30" />
          <p
            className="text-sm text-white/40"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Archive entry not found.
          </p>
          <Link
            href="/"
            className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white"
          >
            ← Return
          </Link>
        </div>
      </div>
    );
  }

  const Icon = reward.icon;

  return (
    <div
      className="relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* ── Grainy texture overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Subtle radial glow ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 45%, rgba(255,255,255,0.02) 0%, transparent 100%)",
        }}
      />

      {/* ── Back button ── */}
      <motion.div
        className="fixed left-6 top-6 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Link
          href="/"
          className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/30 transition-colors duration-300 hover:text-white/70"
        >
          <ArrowLeft
            size={14}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          Return
        </Link>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT — Backdrop-blur "decoding" card
          ═══════════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-12 px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "linear" }}
      >
        {/* ── Top thin rule ── */}
        <motion.div
          className="h-px bg-white/10"
          initial={{ width: 0 }}
          animate={{ width: 64 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
        />

        {/* ── Classification badge ── */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="h-px w-6 bg-white/10" />
          <span
            className="text-[10px] font-semibold tracking-[0.4em] uppercase"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {reward.subtitle}
          </span>
          <div className="h-px w-6 bg-white/10" />
        </motion.div>

        {/* ── Icon display ── */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {/* Backdrop-blur glass ring */}
          <div
            className="flex h-24 w-24 items-center justify-center rounded-2xl border"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
          >
            <Icon size={40} strokeWidth={1} className="text-white/60" />
          </div>
        </motion.div>

        {/* ── Title ── */}
        <motion.h1
          className="text-center text-4xl font-normal text-white md:text-5xl"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          {reward.label}
        </motion.h1>

        {/* ── Description with decoding effect ── */}
        <motion.div
          className="max-w-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: decoded ? 1 : 0.3 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <p
            className="text-center text-base leading-relaxed"
            style={{
              color: decoded
                ? "rgba(255,255,255,0.45)"
                : "rgba(255,255,255,0.15)",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              filter: decoded ? "blur(0px)" : "blur(3px)",
              transition: "filter 0.8s ease, color 0.8s ease",
            }}
          >
            {reward.description}
          </p>
        </motion.div>

        {/* ── Content Preview — depends on reward type ── */}
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {id === "ai_system" && <TerminalPreview />}
          {id === "archagent" && <ArchitecturePreview />}
          {id === "resume" && <DocumentPreview />}
          {id === "projects" && <ProjectGrid />}
        </motion.div>

        {/* ── Bottom rule ── */}
        <motion.div
          className="h-px bg-white/[0.06]"
          initial={{ width: 0 }}
          animate={{ width: 64 }}
          transition={{ duration: 1, delay: 1.4, ease: EASE }}
        />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTENT MODULES — Per-reward type displays
   ═══════════════════════════════════════════════════════════════ */

/** AI System → Glassmorphic terminal window */
function TerminalPreview() {
  const [lines, setLines] = useState<string[]>([]);
  const terminalLines = [
    "$ initializing neural interface...",
    "→ loading knowledge graph (2.4GB)",
    "→ calibrating response matrix",
    "→ context: portfolio.srinivas.rc",
    "✓ system online — awaiting query",
  ];

  useEffect(() => {
    terminalLines.forEach((line, i) => {
      setTimeout(() => {
        setLines((prev) => [...prev, line]);
      }, 800 + i * 500);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        <Terminal size={12} strokeWidth={2} className="text-white/25" />
        <span className="text-[10px] font-medium text-white/25">
          neural-interface v3.1
        </span>
      </div>
      {/* Body */}
      <div className="p-4" style={{ minHeight: "160px" }}>
        {lines.map((line, i) => (
          <motion.p
            key={i}
            className="font-mono text-xs leading-loose"
            style={{
              color: line.startsWith("✓")
                ? "rgba(34,197,94,0.7)"
                : "rgba(255,255,255,0.35)",
            }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {line}
          </motion.p>
        ))}
        {/* Blinking cursor */}
        <motion.span
          className="mt-1 inline-block h-3.5 w-1.5 bg-white/30"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    </div>
  );
}

/** ArchAgent → Architecture viewer placeholder */
function ArchitecturePreview() {
  const layers = [
    { label: "Interface Layer", icon: Layers },
    { label: "Agent Core", icon: Cpu },
    { label: "Memory Store", icon: Bot },
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        <Layers size={12} strokeWidth={2} className="text-white/25" />
        <span className="text-[10px] font-medium text-white/25">
          architecture.viewer
        </span>
      </div>
      <div className="flex flex-col gap-3 p-5">
        {layers.map((layer, i) => {
          const LayerIcon = layer.icon;
          return (
            <motion.div
              key={layer.label}
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
              style={{
                borderColor: "rgba(255,255,255,0.04)",
                background: "rgba(255,255,255,0.01)",
              }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.4 + i * 0.15 }}
            >
              <LayerIcon size={16} strokeWidth={1.5} className="text-white/25" />
              <span className="text-xs font-medium text-white/35">
                {layer.label}
              </span>
              <div className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  className="h-full rounded-full bg-white/15"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 1.5,
                    delay: 1.6 + i * 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** Resume → Classified document preview */
function DocumentPreview() {
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-2">
          <FileText size={12} strokeWidth={2} className="text-white/25" />
          <span className="text-[10px] font-medium text-white/25">
            resume.classified.pdf
          </span>
        </div>
        <span className="text-[9px] font-bold tracking-[0.2em] text-white/15 uppercase">
          Encrypted
        </span>
      </div>
      <div className="flex flex-col gap-3 p-5">
        {[
          { w: "75%", delay: 0 },
          { w: "90%", delay: 0.1 },
          { w: "60%", delay: 0.2 },
          { w: "85%", delay: 0.3 },
          { w: "45%", delay: 0.4 },
        ].map((bar, i) => (
          <motion.div
            key={i}
            className="h-2 rounded-sm bg-white/[0.04]"
            initial={{ width: "0%" }}
            animate={{ width: bar.w }}
            transition={{
              duration: 1,
              delay: 1.4 + bar.delay,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Projects → Grid of project cards */
function ProjectGrid() {
  const projects = [
    { name: "NeuroForge", tag: "AI", progress: 82 },
    { name: "ArchAgent", tag: "Agent", progress: 68 },
    { name: "Portfolio", tag: "Web", progress: 91 },
    { name: "DataPipe", tag: "ML", progress: 74 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {projects.map((project, i) => (
        <motion.div
          key={project.name}
          className="flex flex-col gap-2 rounded-xl border p-4"
          style={{
            borderColor: "rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.015)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.4 + i * 0.1 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">
              {project.name}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {project.tag}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.03]">
            <motion.div
              className="h-full rounded-full bg-white/10"
              initial={{ width: "0%" }}
              animate={{ width: `${project.progress}%` }}
              transition={{
                duration: 1.2,
                delay: 1.6 + i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
