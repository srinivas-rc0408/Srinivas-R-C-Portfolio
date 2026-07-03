"use client";

import { Mail, Gamepad2, Loader2 } from "lucide-react";
import { FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";
import useSWR from "swr";

/* ═══════════════════════════════════════════════════════════════
   FOOTER (AAA LAYOUT)
   Clean glassmorphic layout with glowing icons, a dynamic
   feedback button, and real-time social links fetched from the DB.
   ═══════════════════════════════════════════════════════════════ */

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Footer() {
  const { data: socials, isLoading } = useSWR("/api/socials", fetcher, {
    fallbackData: {
      Instagram: "https://instagram.com",
      Email: "mailto:hello@example.com",
      LinkedIn: "https://linkedin.com",
      GitHub: "https://github.com",
      Steam: "https://steamcommunity.com",
    }
  });

  const socialIcons = [
    { name: "Instagram", icon: <FaInstagram size={18} />, href: socials?.Instagram },
    { name: "Email", icon: <Mail size={18} />, href: socials?.Email?.includes("@") && !socials.Email.startsWith("mailto:") ? `mailto:${socials.Email}` : socials?.Email },
    { name: "LinkedIn", icon: <FaLinkedin size={18} />, href: socials?.LinkedIn },
    { name: "GitHub", icon: <FaGithub size={18} />, href: socials?.GitHub },
    { name: "Steam", icon: <Gamepad2 size={18} />, href: socials?.Steam },
  ];

  // Dynamic Date formatting
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <footer className="w-full relative z-30 bg-black/50 backdrop-blur-xl border-t border-white/10 py-8 flex flex-col items-center gap-6 mt-auto">
      
      {/* ── Social Icons ── */}
      <div className="flex items-center gap-6">
        {isLoading ? (
          <Loader2 className="animate-spin text-zinc-600" size={20} />
        ) : (
          socialIcons.map((social) => (
            <a
              key={social.name}
              href={social.href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center text-zinc-500 transition-colors"
              aria-label={social.name}
            >
              <motion.div
                whileHover={{ scale: 1.2, color: "#ef4444" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md bg-red-500/20" />
                <div className="relative z-10">{social.icon}</div>
              </motion.div>
            </a>
          ))
        )}
      </div>

      {/* ── Feedback Button ── */}
      <button
        onClick={() => {
          // Future integration: Open Feedback Modal
          alert("Feedback Modal (Sprint 3) triggered!");
        }}
        className="group relative flex items-center gap-2 overflow-hidden rounded-full border border-zinc-700 bg-transparent px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-red-500 hover:text-white"
      >
        <span className="relative z-10">GIVE Feedback &rarr;</span>
        <div className="absolute inset-0 z-0 bg-red-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </button>

      {/* ── Dynamic Timestamp ── */}
      <p className="text-xs text-zinc-600 font-medium tracking-wide">
        Portfolio last updated on {lastUpdated}
      </p>
      
    </footer>
  );
}
