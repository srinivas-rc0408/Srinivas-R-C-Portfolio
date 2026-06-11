"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileText, Code2, Scroll, Cpu, Briefcase, GraduationCap, Award, Github, Mail } from "lucide-react";

const sections = [
  { slug: "resume", name: "Resume", tagline: "One page. Everything that matters.", icon: FileText, color: "group-hover:text-violet-500", border: "group-hover:border-violet-500/50" },
  { slug: "projects", name: "Projects", tagline: "Code in production.", icon: Code2, color: "group-hover:text-blue-500", border: "group-hover:border-blue-500/50" },
  { slug: "cv", name: "CV", tagline: "The full academic journey.", icon: Scroll, color: "group-hover:text-teal-500", border: "group-hover:border-teal-500/50" },
  { slug: "skills", name: "Skills", tagline: "The tools I use to build.", icon: Cpu, color: "group-hover:text-green-500", border: "group-hover:border-green-500/50" },
  { slug: "experience", name: "Experience", tagline: "Leadership and execution.", icon: Briefcase, color: "group-hover:text-amber-500", border: "group-hover:border-amber-500/50" },
  { slug: "education", name: "Education", tagline: "Continuous learning.", icon: GraduationCap, color: "group-hover:text-pink-500", border: "group-hover:border-pink-500/50" },
  { slug: "certifications", name: "Certifications", tagline: "Validated expertise.", icon: Award, color: "group-hover:text-orange-500", border: "group-hover:border-orange-500/50" },
  { slug: "open-source", name: "Open Source", tagline: "Building for the community.", icon: Github, color: "group-hover:text-gray-400", border: "group-hover:border-gray-400/50" },
  { slug: "contact", name: "Contact", tagline: "Let's build something great.", icon: Mail, color: "group-hover:text-red-400", border: "group-hover:border-red-400/50" },
];

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
        className="fixed inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none"
        style={{
          background: "linear-gradient(45deg, #000000, #1A1A2E, #2d1b4e, #0f2c3d)",
          backgroundSize: "400% 400%",
          animation: "gradientWash 15s ease infinite"
        }}
      />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradientWash {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-12">
          <ArrowLeft size={20} /> Back to Hub
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
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.div layout key={section.slug} variants={shouldReduceMotion ? {} : itemVars}>
                <Link href={`/section/${section.slug}`} className="block h-full group">
                  <div className={`bg-surface/60 backdrop-blur-sm border border-white/5 rounded-2xl p-8 h-full flex flex-col transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-2xl ${section.border} group-hover:bg-surface/90 relative overflow-hidden`}>
                    
                    {/* Background glow reveal */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10">
                      <Icon size={32} className={`mb-6 text-white/50 transition-colors duration-300 ${section.color}`} />
                      <h2 className="font-space text-2xl font-bold text-white mb-2">{section.name}</h2>
                      <p className="text-text-muted">{section.tagline}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
