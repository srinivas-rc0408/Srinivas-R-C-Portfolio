"use client";

import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileText, Code2, Scroll, Cpu, Briefcase, GraduationCap, Award, Github, Mail } from "lucide-react";
import { useRef } from "react";

const sections = [
  { slug: "resume", name: "Resume", tagline: "One page. Everything that matters.", icon: FileText, accent: "#8b5cf6" },
  { slug: "projects", name: "Projects", tagline: "Code in production.", icon: Code2, accent: "#3b82f6" },
  { slug: "cv", name: "CV", tagline: "The full academic journey.", icon: Scroll, accent: "#14b8a6" },
  { slug: "skills", name: "Skills", tagline: "The tools I use to build.", icon: Cpu, accent: "#22c55e" },
  { slug: "experience", name: "Experience", tagline: "Leadership and execution.", icon: Briefcase, accent: "#f59e0b" },
  { slug: "education", name: "Education", tagline: "Continuous learning.", icon: GraduationCap, accent: "#ec4899" },
  { slug: "certifications", name: "Certifications", tagline: "Validated expertise.", icon: Award, accent: "#f97316" },
  { slug: "open-source", name: "Open Source", tagline: "Building for the community.", icon: Github, accent: "#9ca3af" },
  { slug: "contact", name: "Contact", tagline: "Let's build something great.", icon: Mail, accent: "#f87171" },
];

/* ─── 3D Tilt Card with glassmorphism ─── */
function TiltCard({ section }: { section: typeof sections[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = section.icon;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <Link href={`/section/${section.slug}`} className="block h-full group">
      <motion.div
        ref={ref}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 800,
          willChange: "transform",
        }}
        className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-8 h-full flex flex-col transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(108,99,255,0.1)] relative overflow-hidden"
      >
        {/* Hover border glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 1px ${section.accent}40`,
          }}
        />

        <div className="relative z-10">
          <Icon
            size={32}
            className="mb-6 text-white/40 transition-colors duration-300 group-hover:drop-shadow-lg"
            style={{ color: undefined }}
          />
          {/* Override icon color on hover via parent style */}
          <style>{`
            .group:hover [data-icon="${section.slug}"] { color: ${section.accent} !important; }
          `}</style>
          <div data-icon={section.slug} className="absolute top-0 left-0">
            <Icon size={32} className="mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: section.accent }} />
          </div>
          <h2 className="font-space text-2xl font-bold text-white mb-2">{section.name}</h2>
          <p className="text-text-muted">{section.tagline}</p>
        </div>
      </motion.div>
    </Link>
  );
}

export default function SectionsBrowser() {
  const shouldReduceMotion = useReducedMotion();
  
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated CSS Gradient Wash Background */}
      <div 
        className="fixed inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          background: "linear-gradient(45deg, #05050A, #0A0A12, #1a0d2e, #0a1a2a)",
          backgroundSize: "400% 400%",
          animation: "gradientWash 15s ease infinite"
        }}
      />

      {/* Ambient glow */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(108,99,255,0.06) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Fixed global Back to Home */}
        <Link
          href="/"
          className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-full text-text-muted hover:text-white hover:bg-white/[0.1] transition-all duration-300 min-h-[44px] shadow-lg"
        >
          <ArrowLeft size={16} /> Home
        </Link>

        
        <div className="mb-16">
          <h1 className="font-space text-4xl md:text-5xl font-bold mb-4">Browse Sections</h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Explore the complete portfolio layout. Click on any module to view the full details and access downloads.
          </p>
        </div>

        <motion.div 
          layout
          variants={shouldReduceMotion ? {} : containerVars}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sections.map((section) => (
            <motion.div layout key={section.slug} variants={shouldReduceMotion ? {} : itemVars}>
              <TiltCard section={section} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
