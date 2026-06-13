"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { useFeedbackTimer } from "@/hooks/useFeedbackTimer";

export default function FeedbackModal() {
  const { showFeedback, snooze, complete } = useFeedbackTimer();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [message]);

  // Listen for manual open trigger (from Footer)
  const [forceShow, setForceShow] = useState(false);
  useEffect(() => {
    const handleOpen = () => setForceShow(true);
    window.addEventListener("openFeedback", handleOpen);
    return () => window.removeEventListener("openFeedback", handleOpen);
  }, []);

  const handleSnooze = () => {
    setForceShow(false);
    snooze();
  };

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      toast.error("Please write at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const guestId = typeof window !== "undefined" ? localStorage.getItem("guestName") : null;

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: message.trim(), guestId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send feedback.");
        return;
      }

      toast.success("Thank you for your feedback! 🎉");
      setMessage("");
      complete();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {(showFeedback || forceShow) && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-6 right-6 z-[60] w-[360px] max-w-[calc(100vw-3rem)]"
        >
          <div
            className="rounded-2xl border border-white/[0.05] p-5 relative"
            style={{
              background: "rgba(10,10,18,0.85)",
              backdropFilter: "blur(40px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
            }}
          >
            {/* Close button */}
            <button
              onClick={handleSnooze}
              className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <MessageSquare size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="font-space font-bold text-sm text-white/90">Quick Feedback</h3>
                <p className="text-[11px] text-white/40">Help me improve this portfolio</p>
              </div>
            </div>

            {/* Email Input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address..."
              required
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 mb-3 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-accent/40 transition-colors font-space"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you think? Any suggestions..."
              maxLength={500}
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-accent/40 transition-colors font-space"
              style={{ minHeight: 72 }}
            />

            {/* Character count */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-white/20 font-mono">
                {message.length}/500
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 gap-3">
              <button
                onClick={handleSnooze}
                className="text-xs text-white/40 hover:text-white/80 transition-colors font-space"
              >
                Remind me later
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting || message.trim().length < 10}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed font-space"
                style={{
                  background: submitting
                    ? "rgba(108,99,255,0.2)"
                    : "linear-gradient(135deg, rgba(108,99,255,0.8), rgba(139,92,246,0.8))",
                  boxShadow: submitting
                    ? "none"
                    : "0 0 20px rgba(108,99,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
