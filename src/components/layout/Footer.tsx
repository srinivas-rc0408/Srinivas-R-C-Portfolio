"use client";

import { useState } from "react";
import { Mail, Gamepad2, Loader2 } from "lucide-react";
import { FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";
import useSWR from "swr";
import FeedbackModal from "@/src/components/modals/FeedbackModal";
import { formatDateWithDay } from "@/lib/formatDate";

/* ═══════════════════════════════════════════════════════════════
   FOOTER (AAA LAYOUT)
   Clean glassmorphic layout with glowing icons, a dynamic
   feedback button, and real-time social links fetched from the DB.
   ═══════════════════════════════════════════════════════════════ */

import { fetcher } from "@/lib/fetcher";

export default function Footer() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { data: socials, isLoading } = useSWR<Record<string, string>>("/api/socials", fetcher, {
    fallbackData: {
      Instagram: "https://instagram.com",
      Email: "mailto:hello@example.com",
      LinkedIn: "https://linkedin.com",
      GitHub: "https://github.com",
      Steam: "https://steamcommunity.com",
    }
  });
  const { data: lastUpdated } = useSWR<{ updatedAt: string }>("/api/last-updated", fetcher);

  const socialIcons = [
    { name: "Instagram", icon: <FaInstagram size={18} />, href: socials?.Instagram },
    { name: "Email", icon: <Mail size={18} />, href: socials?.Email?.includes("@") && !socials.Email.startsWith("mailto:") ? `mailto:${socials.Email}` : socials?.Email },
    { name: "LinkedIn", icon: <FaLinkedin size={18} />, href: socials?.LinkedIn },
    { name: "GitHub", icon: <FaGithub size={18} />, href: socials?.GitHub },
    { name: "Steam", icon: <Gamepad2 size={18} />, href: socials?.Steam },
  ];

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
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsFeedbackOpen(true)}
        className="group relative flex items-center gap-2 overflow-hidden rounded-full border border-zinc-700 bg-transparent px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-red-500 hover:text-white"
      >
        <span className="relative z-10">GIVE Feedback &rarr;</span>
        <div className="absolute inset-0 z-0 bg-red-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </motion.button>

      {/* ── Dynamic Timestamp ── */}
      <p className="text-xs text-zinc-600 font-medium tracking-wide">
        Portfolio last updated on {lastUpdated ? formatDateWithDay(lastUpdated.updatedAt) : "…"}
      </p>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

    </footer>
  );
}
