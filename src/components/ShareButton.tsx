"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, X, Loader2 } from "lucide-react";
import { useEscape } from "@/src/hooks/useEscape";

/* ═══════════════════════════════════════════════════════════════
   SHARE BUTTON COMPONENT
   Sleek button that opens a glassmorphic modal to collect an email
   address, hits the /api/share endpoint, and smoothly animates
   into a circular success state.
   ═══════════════════════════════════════════════════════════════ */

interface ShareButtonProps {
  documentType: string;
}

export default function ShareButton({ documentType }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  useEscape(isOpen, () => setIsOpen(false));

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: email, documentType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send document");
      }

      setStatus("success");
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => {
          setStatus("idle");
          setEmail("");
        }, 300); // wait for modal to close before resetting state
      }, 3000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-3 overflow-hidden rounded-full px-6 py-4 shadow-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.98)",
          color: "#000",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <span className="text-xs font-bold uppercase tracking-[0.15em]">
          Request {documentType}
        </span>
        <Send size={14} strokeWidth={2.5} />
      </motion.button>

      {/* ── Glassmorphic Modal ── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => status !== "loading" && setIsOpen(false)}
            />

            {/* Modal Card */}
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                background: "rgba(15,15,20,0.85)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Close Button */}
              {status !== "loading" && status !== "success" && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-4 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}

              <div className="flex flex-col items-center p-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  <Send size={20} className="text-white/80" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-white" style={{ fontFamily: "'Georgia', serif" }}>
                  Request {documentType}
                </h3>
                <p className="mb-8 text-xs text-white/40">
                  Enter your email to receive this document instantly from the secure archive.
                </p>

                <form onSubmit={handleShare} className="flex w-full flex-col gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    required
                    disabled={status === "loading" || status === "success"}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                  />
                  
                  {status === "error" && (
                    <p className="text-xs text-red-400">{errorMessage}</p>
                  )}

                  {/* ── Animated Submit Button ── */}
                  <div className="relative mt-2 flex justify-center h-[52px]">
                    <AnimatePresence mode="wait">
                      {status === "idle" || status === "error" ? (
                        <motion.button
                          key="submit"
                          type="submit"
                          className="w-full rounded-xl bg-white text-black text-xs font-bold uppercase tracking-widest shadow-lg"
                          style={{ height: "52px" }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Send Document
                        </motion.button>
                      ) : status === "loading" ? (
                        <motion.button
                          key="loading"
                          disabled
                          className="rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20"
                          style={{ width: "52px", height: "52px" }}
                          initial={{ width: "100%", borderRadius: "12px" }}
                          animate={{ width: "52px", borderRadius: "26px" }}
                          transition={{ duration: 0.3 }}
                        >
                          <Loader2 size={20} className="animate-spin" />
                        </motion.button>
                      ) : (
                        <motion.button
                          key="success"
                          disabled
                          className="rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                          style={{ width: "52px", height: "52px" }}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <Check size={24} strokeWidth={3} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
