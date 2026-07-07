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

  /* Per-platform hover glow — each logo lights up in its own brand color. */
  const socialIcons = [
    { name: "Instagram", icon: <FaInstagram size={18} />, href: socials?.Instagram, glow: "#E1306C" },
    { name: "Email", icon: <Mail size={18} />, href: socials?.Email?.includes("@") && !socials.Email.startsWith("mailto:") ? `mailto:${socials.Email}` : socials?.Email, glow: "#DC2626" },
    { name: "LinkedIn", icon: <FaLinkedin size={18} />, href: socials?.LinkedIn, glow: "#0A66C2" },
    { name: "GitHub", icon: <FaGithub size={18} />, href: socials?.GitHub, glow: "#F0F6FC" },
    { name: "Steam", icon: <Gamepad2 size={18} />, href: socials?.Steam, glow: "#66C0F4" },
  ];

  return (
    <footer className="relative z-30 mt-auto w-full border-t border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-6 py-10">

        {/* ── Connect with me ── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Connect with me</p>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="animate-spin text-zinc-600" size={20} />
          ) : (
            socialIcons.map((social) => (
              <a
                key={social.name}
                href={social.href || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-colors duration-300 hover:bg-white/5"
                style={{ "--glow": social.glow } as React.CSSProperties}
              >
                {/* glow layer — opacity-only, colored per platform */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-1 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
                  style={{ background: "var(--glow)" }}
                />
                <motion.span
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative z-10 transition-colors duration-300 group-hover:text-white"
                >
                  {social.icon}
                </motion.span>
              </a>
            ))
          )}
        </div>

        {/* ── Feedback — the footer's primary action, red accent ── */}
        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFeedbackOpen(true)}
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-red-500/40 bg-red-600/15 px-7 py-3 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-xl transition-colors duration-300 hover:border-red-500/70 hover:bg-red-600/25"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ boxShadow: "0 0 24px rgba(220,38,38,0.45), inset 0 0 12px rgba(220,38,38,0.15)" }}
          />
          <span className="relative z-10">Give Feedback</span>
          <span aria-hidden className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
        </motion.button>

        {/* ── Timestamp + copyright ── */}
        <div className="flex flex-col items-center gap-1 pt-1 text-center">
          <p className="text-xs font-medium tracking-wide text-white/40">
            Portfolio last updated on {lastUpdated ? formatDateWithDay(lastUpdated.updatedAt) : "…"}
          </p>
          <p className="text-[11px] tracking-wide text-white/35">
            © {new Date().getFullYear()} Srinivas R C. All rights reserved.
          </p>
        </div>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </footer>
  );
}
