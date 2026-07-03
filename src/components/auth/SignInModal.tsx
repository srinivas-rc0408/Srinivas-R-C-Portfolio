"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════
   SIGN IN MODAL (GLASSMORPHIC)
   Non-blocking blur overlay with tactile physics.
   ═══════════════════════════════════════════════════════════════ */

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (res.ok) {
        // Success -> Route to Admin Dashboard
        onClose();
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Non-Blocking Blur Overlay ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl"
            onClick={onClose}
          >
            {/* ── Glassmorphic Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm max-h-[85vh] overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-[0_25px_50px_-12px_rgba(220,38,38,0.25)]"
            >
              {/* Close Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </motion.button>

              <div className="mb-8 flex flex-col items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                  <Lock size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-widest text-white uppercase">Authentication</h2>
                <p className="text-xs text-zinc-400 mt-1">Authorized personnel only.</p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                {/* Email Input (Floating Label) */}
                <div className="relative group">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-red-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer w-full rounded-xl border border-white/10 bg-black/50 px-11 py-3.5 text-sm text-white placeholder-transparent outline-none transition-colors focus:border-red-500"
                    placeholder="Email Address"
                  />
                  <label className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:font-bold peer-focus:tracking-widest peer-focus:text-red-500 peer-focus:uppercase peer-focus:bg-zinc-900 peer-focus:px-1 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-[10px] peer-valid:font-bold peer-valid:tracking-widest peer-valid:text-zinc-500 peer-valid:uppercase peer-valid:bg-zinc-900 peer-valid:px-1">
                    Email Address
                  </label>
                </div>

                {/* Password Input (Floating Label) */}
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-red-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer w-full rounded-xl border border-white/10 bg-black/50 px-11 py-3.5 text-sm text-white placeholder-transparent outline-none transition-colors focus:border-red-500"
                    placeholder="Password"
                  />
                  <label className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:font-bold peer-focus:tracking-widest peer-focus:text-red-500 peer-focus:uppercase peer-focus:bg-zinc-900 peer-focus:px-1 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-[10px] peer-valid:font-bold peer-valid:tracking-widest peer-valid:text-zinc-500 peer-valid:uppercase peer-valid:bg-zinc-900 peer-valid:px-1">
                    Password
                  </label>
                </div>

                {error && <p className="text-center text-xs font-semibold text-red-500">{error}</p>}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.95 }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : "ACCESS ADMIN_OS"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
