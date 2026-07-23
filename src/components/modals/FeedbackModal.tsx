"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   FEEDBACK MODAL
   Small glass form: email + message -> POST /api/feedback.
   ═══════════════════════════════════════════════════════════════ */

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MESSAGE_MAX = 2000;

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setEmail("");
      setMessage("");
      setError("");
      setSuccess(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit feedback.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-[0_25px_50px_-12px_rgba(220,38,38,0.25)]"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </motion.button>

            {success ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={22} />
                </div>
                <h2 className="text-lg font-bold text-white">Thanks for the feedback!</h2>
                <p className="text-xs text-zinc-400">Srinivas will take a look soon.</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="mt-2 rounded-xl bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
                >
                  Done
                </motion.button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col items-center">
                  <div className="relative mb-4">
                    <div aria-hidden className="absolute inset-0 rounded-full bg-red-500/40 blur-md" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500">
                      <MessageSquare size={20} />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-widest text-white">Feedback</h2>
                  <p className="mt-1 text-xs text-zinc-400">Tell Srinivas what you think.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-red-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-11 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-red-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
                      placeholder="Your feedback..."
                      rows={5}
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-red-500"
                    />
                    <span className="self-end text-[10px] text-zinc-600">{message.length}/{MESSAGE_MAX}</span>
                  </div>

                  {error && <p className="text-center text-xs font-semibold text-red-500">{error}</p>}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.95 }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Send Feedback"}
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
