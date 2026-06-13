"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { getActiveFooterLinks } from "@/app/actions/footer";
import { useFeedbackTimer } from "@/hooks/useFeedbackTimer";

interface FooterLinkItem {
  id: string;
  platform: string;
  url: string;
  iconName: string;
}

export default function Footer() {
  const [links, setLinks] = useState<FooterLinkItem[]>([]);
  const { snooze, complete, showFeedback } = useFeedbackTimer(); // Just use snooze to force it if needed, or we can use another state. Wait, useFeedbackTimer just controls if it's currently showing based on timers.

  // Actually, we need a way to manually trigger it. Since the state is in useFeedbackTimer,
  // let's just dispatch a custom event, or since useFeedbackTimer sets `showFeedback` via local state,
  // we might need to expose a `triggerFeedback` method or we can just adjust the hook if needed.
  // Actually, let's just manipulate the localStorage and reload, or maybe we don't need a reload.
  
  // For a seamless experience, let's create a custom event "openFeedback" that the FeedbackModal listens to.
  
  const handleOpenFeedback = () => {
    window.dispatchEvent(new Event("openFeedback"));
  };

  useEffect(() => {
    async function load() {
      const data = await getActiveFooterLinks();
      setLinks(data);
    }
    load();
  }, []);

  return (
    <footer className="w-full bg-gradient-to-t from-[#05050A] to-transparent border-t border-white/[0.05] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Side: Copyright / Name */}
        <div className="text-white/40 text-sm font-space">
          &copy; {new Date().getFullYear()} Srinivas R C. All rights reserved.
        </div>

        {/* Center: Dynamic Links */}
        <div className="flex items-center gap-6">
          {links.map((link) => {
            const Icon = (LucideIcons as any)[link.iconName] || LucideIcons.Link;
            return (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-white/50 hover:text-cyan-400 transition-colors"
                title={link.platform}
              >
                <Icon size={20} />
              </motion.a>
            );
          })}
        </div>

        {/* Right Side: Feedback Trigger */}
        <div>
          <button
            onClick={handleOpenFeedback}
            className="text-sm font-space text-white/50 hover:text-white transition-colors bg-white/[0.02] border border-white/[0.05] px-4 py-2 rounded-full hover:bg-white/[0.05]"
          >
            Send Feedback
          </button>
        </div>
        
      </div>
    </footer>
  );
}
