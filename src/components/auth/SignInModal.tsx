"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Mail, User, Phone, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";

/* ═══════════════════════════════════════════════════════════════
   SIGN IN MODAL — visitor auth
   Three tabs: Continue as Guest / Sign In / Register.
   If already signed in as a registered user, shows a signed-in
   panel with Log Out instead of the tabs.
   ═══════════════════════════════════════════════════════════════ */

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "guest" | "signin" | "register";

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { isRegistered, displayName, email, refresh, setGuestName } = useAuth();
  const [tab, setTab] = useState<Tab>("guest");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm max-h-[85vh] overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-[0_25px_50px_-12px_rgba(220,38,38,0.25)]"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </motion.button>

            {isRegistered ? (
              <SignedInPanel name={displayName} email={email} onLoggedOut={() => refresh()} onClose={onClose} />
            ) : (
              <>
                <div className="mb-6 flex flex-col items-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                    <Lock size={20} />
                  </div>
                  <h2 className="text-xl font-bold tracking-widest text-white uppercase">Welcome</h2>
                  <p className="text-xs text-zinc-400 mt-1">Continue as a guest or sign in.</p>
                </div>

                <div className="mb-6 flex rounded-xl border border-white/10 bg-black/30 p-1">
                  {(["guest", "signin", "register"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        tab === t ? "bg-red-500 text-white" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      {t === "guest" ? "Guest" : t === "signin" ? "Sign In" : "Register"}
                    </button>
                  ))}
                </div>

                {tab === "guest" && <GuestTab onDone={onClose} setGuestName={setGuestName} />}
                {tab === "signin" && <SignInTab onSuccess={() => { refresh(); onClose(); }} />}
                {tab === "register" && <RegisterTab onSuccess={() => { refresh(); onClose(); }} />}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Signed-in panel ── */
function SignedInPanel({
  name,
  email,
  onLoggedOut,
  onClose,
}: {
  name: string | null;
  email?: string;
  onLoggedOut: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/user/logout", { method: "POST" });
    onLoggedOut();
    setLoading(false);
    onClose();
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        <User size={24} />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-white">{name}</p>
        {email && <p className="text-xs text-zinc-500 mt-1">{email}</p>}
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={14} />}
        Log Out
      </motion.button>
    </div>
  );
}

/* ── Guest tab ── */
function GuestTab({ onDone, setGuestName }: { onDone: () => void; setGuestName: (name: string) => void }) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setGuestName(name.trim());
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FloatingInput icon={<User size={16} />} type="text" value={name} onChange={setName} label="Your Name" required />
      <p className="text-center text-[10px] text-zinc-500">Stored on this device only. No account, no downloads.</p>
      <SubmitButton label="Continue as Guest" />
    </form>
  );
}

/* ── Sign in tab ── */
function SignInTab({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to sign in.");
        return;
      }
      onSuccess();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FloatingInput icon={<Mail size={16} />} type="email" value={email} onChange={setEmail} label="Email Address" required />
      <FloatingInput icon={<Lock size={16} />} type="password" value={password} onChange={setPassword} label="Password" required />
      {error && <p className="text-center text-xs font-semibold text-red-500">{error}</p>}
      <SubmitButton label="Sign In" loading={loading} />
    </form>
  );
}

/* ── Register tab ── */
function RegisterTab({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to register.");
        return;
      }
      onSuccess();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FloatingInput icon={<User size={16} />} type="text" value={name} onChange={setName} label="Full Name" required />
      <FloatingInput icon={<Mail size={16} />} type="email" value={email} onChange={setEmail} label="Email Address" required />
      <FloatingInput icon={<Phone size={16} />} type="tel" value={phone} onChange={setPhone} label="Phone (optional)" />
      <FloatingInput icon={<Lock size={16} />} type="password" value={password} onChange={setPassword} label="Password (min 8 chars)" required minLength={8} />
      {error && <p className="text-center text-xs font-semibold text-red-500">{error}</p>}
      <SubmitButton label="Create Account" loading={loading} />
    </form>
  );
}

/* ── Shared bits ── */
function FloatingInput({
  icon,
  type,
  value,
  onChange,
  label,
  required,
  minLength,
}: {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-red-500">
        {icon}
      </span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="peer w-full rounded-xl border border-white/10 bg-black/50 px-11 py-3.5 text-sm text-white placeholder-transparent outline-none transition-colors focus:border-red-500"
        placeholder={label}
      />
      <label className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-[10px] peer-focus:font-bold peer-focus:tracking-widest peer-focus:text-red-500 peer-focus:uppercase peer-focus:bg-zinc-900 peer-focus:px-1 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-[10px] peer-valid:font-bold peer-valid:tracking-widest peer-valid:text-zinc-500 peer-valid:uppercase peer-valid:bg-zinc-900 peer-valid:px-1">
        {label}
      </label>
    </div>
  );
}

function SubmitButton({ label, loading }: { label: string; loading?: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : label}
    </motion.button>
  );
}
