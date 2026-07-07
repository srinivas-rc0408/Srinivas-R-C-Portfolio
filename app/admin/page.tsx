"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, Shield } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   ADMIN LOGIN — /admin
   Secure gateway with terminal aesthetic.
   Credentials validated server-side against env vars.
   ═══════════════════════════════════════════════════════════════ */

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Authentication failed.");
          setLoading(false);
          return;
        }

        // Authenticated — navigate to dashboard
        router.push("/admin/dashboard");
      } catch {
        setError("Network error. Please try again.");
        setLoading(false);
      }
    },
    [email, password, router]
  );

  return (
    <div
      className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* Grainy texture */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 100%)",
        }}
      />

      {/* ── Login Card ── */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background:
              "linear-gradient(180deg, rgba(10,10,14,0.99) 0%, rgba(4,4,6,1) 100%)",
            boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
          }}
        >
          {/* ── Header bar ── */}
          <div
            className="flex items-center gap-2 border-b px-5 py-3"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}
          >
            <Shield size={12} strokeWidth={2} className="text-white/20" />
            <span className="text-[10px] font-medium text-white/20">
              srinivas_secure — admin gateway
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-white/[0.06]" />
              <div className="h-2 w-2 rounded-full bg-white/[0.06]" />
              <div className="h-2 w-2 rounded-full bg-white/[0.06]" />
            </div>
          </div>

          {/* ── Content ── */}
          <div className="flex flex-col items-center gap-8 p-8 pt-10">
            {/* Lock icon */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <Lock size={28} strokeWidth={1} className="text-white/40" />
            </div>

            <div className="flex flex-col items-center gap-1">
              <h1
                className="text-xl font-semibold text-white/90"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  letterSpacing: "-0.01em",
                }}
              >
                Admin Gateway
              </h1>
              <p className="text-xs text-white/30">
                Authenticate to access the dashboard
              </p>
            </div>

            {/* ── Error ── */}
            {error && (
              <motion.div
                className="flex w-full items-center gap-2 rounded-lg border px-4 py-3"
                style={{
                  borderColor: "rgba(239,68,68,0.2)",
                  background: "rgba(239,68,68,0.05)",
                }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle size={14} className="shrink-0 text-red-400/70" />
                <span className="text-xs font-medium text-red-400/80">
                  {error}
                </span>
              </motion.div>
            )}

            {/* ── Form ── */}
            <form
              onSubmit={handleLogin}
              className="flex w-full flex-col gap-4"
            >
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-email"
                  className="text-[10px] font-semibold tracking-[0.15em] text-white/25 uppercase"
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm text-white/80 outline-none transition-colors duration-200 placeholder:text-white/15 focus:border-white/20"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-password"
                  className="text-[10px] font-semibold tracking-[0.15em] text-white/25 uppercase"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm text-white/80 outline-none transition-colors duration-200 placeholder:text-white/15 focus:border-white/20"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                />
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2.5 py-3.5 text-sm font-bold uppercase disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "#fff",
                  color: "#000",
                  letterSpacing: "0.12em",
                }}
                whileHover={{ scale: 1.01, background: "rgba(255,255,255,0.9)" }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : (
                  <>
                    Authenticate
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* ── Footer ── */}
          <div
            className="border-t px-5 py-3 text-center"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}
          >
            <span className="text-[10px] text-white/15">
              Secured with JWT · httpOnly cookies · server-side validation
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
