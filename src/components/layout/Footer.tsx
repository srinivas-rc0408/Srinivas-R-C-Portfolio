"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Gamepad2, Loader2 } from "lucide-react";
import { FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import useSWR from "swr";
import FeedbackModal from "@/src/components/modals/FeedbackModal";
import { formatDateWithDay } from "@/lib/formatDate";

/* ═══════════════════════════════════════════════════════════════
   FOOTER (AAA LAYOUT)
   Full-width glassmorphic footer: brand column, explore nav,
   connect column with glowing social icons + feedback CTA,
   oversized wordmark, and a bottom legal bar. Socials and the
   last-updated stamp stay live from the DB.
   ═══════════════════════════════════════════════════════════════ */

import { fetcher } from "@/lib/fetcher";

const EXPLORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "All Details", href: "/details" },
  { label: "Interactive Mode", href: "/game" },
];

export default function Footer() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const reduceMotion = useReducedMotion();
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
    // no overflow-hidden on <footer> — in the flex column it would zero the
    // footer's min-content size and collapse it; children clip themselves
    <footer className="relative z-30 mt-auto w-full shrink-0 border-t border-white/10 bg-white/[0.03] backdrop-blur-xl">
      {/* Subtle red glow rising from the bottom edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(220,38,38,0.07) 0%, transparent 100%)",
        }}
      />

      {/* Chibi Spidey keeping watch on the right (owner-provided asset) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-16 right-3 hidden w-[90px] sm:block md:right-8 md:w-[120px]"
        animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/spiderman/footer-spidey.png"
          width={435}
          height={570}
          sizes="120px"
          alt=""
          style={{ width: "100%", height: "auto" }}
        />
      </motion.div>

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-8 pt-14 md:px-10">
        {/* ── Top: three columns ── */}
        <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-3 md:gap-8 md:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <span className="whitespace-nowrap text-lg font-black uppercase tracking-[0.25em] text-white">
              Srinivas R C
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
              AI/ML Engineer &amp; Full-Stack Developer
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Bengaluru, India
            </p>
          </div>

          {/* Explore */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Explore</p>
            <nav className="flex flex-col items-center gap-2.5 md:items-start">
              {EXPLORE_LINKS.map(({ label, href }) => (
                <Link key={href} href={href} className="group">
                  <motion.span
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors duration-200 group-hover:text-white"
                  >
                    {label}
                    <span
                      aria-hidden
                      className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                    >
                      &rarr;
                    </span>
                  </motion.span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Connect */}
          <div className="flex flex-col items-center gap-4 md:items-start">
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
              className="group relative mt-1 flex items-center gap-2 overflow-hidden rounded-xl border border-red-500/40 bg-red-600/15 px-7 py-3 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-xl transition-colors duration-300 hover:border-red-500/70 hover:bg-red-600/25"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ boxShadow: "0 0 24px rgba(220,38,38,0.45), inset 0 0 12px rgba(220,38,38,0.15)" }}
              />
              <span className="relative z-10">Give Feedback</span>
              <span aria-hidden className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
            </motion.button>
          </div>
        </div>

        {/* ── Oversized wordmark — full name, always one line ── */}
        <div aria-hidden className="pointer-events-none mt-10 hidden select-none overflow-hidden md:block">
          <p className="whitespace-nowrap text-center text-[clamp(3rem,9vw,8.5rem)] font-black uppercase leading-[0.8] tracking-[0.06em] text-white/[0.03]">
            Srinivas R C
          </p>
        </div>

        {/* ── Bottom bar: timestamp + copyright ── */}
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-6 md:flex-row">
          <p className="text-[11px] tracking-wide text-white/35">
            © {new Date().getFullYear()} Srinivas R C. All rights reserved.
          </p>
          <p className="text-xs font-medium tracking-wide text-white/40">
            Portfolio last updated on {lastUpdated ? formatDateWithDay(lastUpdated.updatedAt) : "…"}
          </p>
        </div>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </footer>
  );
}
