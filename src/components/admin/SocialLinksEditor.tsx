"use client";

import { useState, useEffect } from "react";
import { Mail, Gamepad2, Loader2, Save } from "lucide-react";
import { FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAdminStore } from "@/src/contexts/AdminStore";

/* ═══════════════════════════════════════════════════════════════
   ADMIN: SOCIAL LINKS EDITOR
   Manages global footer URLs. Hooks directly into the
   PendingChangesStore for centralized updates.
   ═══════════════════════════════════════════════════════════════ */

interface SocialsData {
  Instagram: string;
  Email: string;
  LinkedIn: string;
  GitHub: string;
  Steam: string;
  [key: string]: string;
}

export default function SocialLinksEditor() {
  const { addChange } = useAdminStore();
  const [socials, setSocials] = useState<SocialsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current data on mount
  useEffect(() => {
    fetch("/api/socials")
      .then((res) => res.json())
      .then((data) => {
        setSocials(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load socials:", err);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (platform: keyof SocialsData, value: string) => {
    if (!socials) return;

    const newSocials = { ...socials, [platform]: value };
    setSocials(newSocials);

    // Dispatch to Pending Changes Staging Area
    addChange({
      id: "socials",
      section: "Socials & Footer",
      field: `${platform} Link`,
      status: "Modified",
      payload: newSocials,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  const platforms = [
    { key: "Instagram", icon: <FaInstagram size={18} />, placeholder: "https://instagram.com/yourhandle" },
    { key: "Email", icon: <Mail size={18} />, placeholder: "hello@example.com" },
    { key: "LinkedIn", icon: <FaLinkedin size={18} />, placeholder: "https://linkedin.com/in/yourprofile" },
    { key: "GitHub", icon: <FaGithub size={18} />, placeholder: "https://github.com/yourhandle" },
    { key: "Steam", icon: <Gamepad2 size={18} />, placeholder: "https://steamcommunity.com/id/yourid" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl flex flex-col gap-8 pb-32">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <h2 className="text-2xl font-black uppercase tracking-widest text-white">
          Socials & Footer <span className="text-red-500">Engine</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Update the global links displayed across the public application.
        </p>
      </div>

      {/* ── Form Stack ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        {platforms.map((platform) => (
          <div key={platform.key} className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
              {platform.icon} {platform.key}
            </label>
            <input
              type="text"
              value={socials?.[platform.key] || ""}
              onChange={(e) => handleChange(platform.key, e.target.value)}
              placeholder={platform.placeholder}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
        ))}
      </motion.div>

      {/* ── Explainer ── */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3 mt-4">
        <Save className="text-red-400 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-zinc-400 leading-relaxed">
          Modifying any link automatically stages it in the <strong className="text-red-400">Pending Changes</strong> engine. 
          You must click the "Update Changes All" button in the top header to write these changes to the SQLite database.
        </p>
      </div>

    </div>
  );
}
