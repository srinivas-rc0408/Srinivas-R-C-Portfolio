"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";

const roles = [
  "AI/ML Engineer",
  "Full Stack Developer",
  "IoT Enthusiast",
  "REVA University, 2027"
];

export default function HeroSection() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
      if (displayText === "") {
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % roles.length);
      } else {
        timer = setTimeout(() => {
          setDisplayText(currentRole.substring(0, displayText.length - 1));
        }, 50);
      }
    } else {
      if (displayText === currentRole) {
        timer = setTimeout(() => setIsDeleting(true), 2000);
      } else {
        timer = setTimeout(() => {
          setDisplayText(currentRole.substring(0, displayText.length + 1));
        }, 100);
      }
    }
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, roleIndex]);

  const container = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.5
      }
    }
  };

  const item = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.section 
      variants={container}
      initial="hidden"
      animate="show"
      layout
      className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4 relative z-10"
    >
      <motion.h1 layout variants={shouldReduceMotion ? {} : item} className="font-space text-5xl md:text-7xl font-bold mb-4 tracking-tight">
        Srinivas R C
      </motion.h1>
      
      <motion.div layout variants={shouldReduceMotion ? {} : item} className="h-8 mb-6">
        <p className="font-mono text-xl md:text-2xl text-accent">
          {displayText}<span className="animate-pulse">|</span>
        </p>
      </motion.div>
      
      <motion.p layout variants={shouldReduceMotion ? {} : item} className="text-text-muted text-lg max-w-lg mb-10">
        Building production-grade systems at student scale.
      </motion.p>
      
      <motion.div layout variants={shouldReduceMotion ? {} : item} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          onClick={() => document.getElementById('nav-hub')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-8 py-3 rounded-full bg-surface border border-accent/30 hover:border-accent hover:shadow-[0_0_15px_rgba(108,99,255,0.5)] transition-all duration-300 font-medium"
        >
          EXPLORE
        </button>
        <Link 
          href="/game"
          className="px-8 py-3 rounded-full bg-surface border border-secondary/30 hover:border-secondary hover:shadow-[0_0_15px_rgba(255,101,132,0.5)] transition-all duration-300 font-medium text-center"
        >
          PLAY
        </Link>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('openGambleModal'))}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-accent to-secondary text-white font-medium hover:opacity-90 hover:shadow-[0_0_20px_rgba(108,99,255,0.6)] transition-all duration-300"
        >
          GAMBLE
        </button>
      </motion.div>
    </motion.section>
  );
}
