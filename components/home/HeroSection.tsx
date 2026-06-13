"use client";

import { motion, useReducedMotion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const roles = [
  "AI/ML Engineer",
  "Full Stack Developer",
  "LLM Application Builder",
  "REVA University, 2027"
];

/* ─── Magnetic button wrapper ─── */
function MagneticButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.2);
    y.set((e.clientY - cy) * 0.2);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY, willChange: "transform" }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={className}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

function MagneticLink({ children, className, href }: { children: React.ReactNode; className: string; href: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.2);
    y.set((e.clientY - cy) * 0.2);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY, willChange: "transform" }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

/* ─── Word-by-word reveal ─── */
function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.3em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.08,
              ease: [0.33, 1, 0.68, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

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

  return (
    <section className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4 relative z-10">
      {/* Ambient LED glow behind hero text */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none -z-10"
        style={{
          background: "radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, rgba(255,101,132,0.04) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      {/* Name — word-by-word masked reveal */}
      <h1 className="font-space text-5xl md:text-7xl font-bold mb-4 tracking-tight">
        {shouldReduceMotion ? (
          "Srinivas R C"
        ) : (
          <WordReveal text="Srinivas R C" delay={0.1} />
        )}
      </h1>
      
      {/* Typewriter role */}
      <motion.div
        initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="h-8 mb-6"
      >
        <p className="font-mono text-xl md:text-2xl text-accent">
          {displayText}<span className="animate-pulse">|</span>
        </p>
      </motion.div>
      
      {/* Tagline — word reveal emphasizing LLM focus */}
      <motion.p
        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        className="text-text-muted text-lg max-w-lg mb-10"
      >
        Building & deploying production-grade LLM web applications at student scale.
      </motion.p>
      
      {/* Magnetic CTA Buttons */}
      <motion.div
        initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
      >
        <MagneticButton 
          onClick={() => document.getElementById('nav-hub')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-8 py-3 rounded-full bg-card border border-border hover:border-accent/60 hover:shadow-[0_0_20px_rgba(108,99,255,0.3)] transition-all duration-300 font-medium min-h-[44px]"
        >
          EXPLORE
        </MagneticButton>
        <MagneticLink 
          href="/game"
          className="px-8 py-3 rounded-full bg-card border border-border hover:border-secondary/60 hover:shadow-[0_0_20px_rgba(255,101,132,0.3)] transition-all duration-300 font-medium text-center inline-block min-h-[44px]"
        >
          PLAY
        </MagneticLink>
        <MagneticButton 
          onClick={() => window.dispatchEvent(new CustomEvent('openGambleModal'))}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-accent to-secondary text-white font-medium hover:opacity-90 hover:shadow-[0_0_25px_rgba(108,99,255,0.4)] transition-all duration-300 min-h-[44px]"
        >
          GAMBLE
        </MagneticButton>
      </motion.div>
    </section>
  );
}
