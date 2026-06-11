"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const callbackUrl = searchParams.get("callbackUrl") || "/sections";
  
  const [activeTab, setActiveTab] = useState<"login" | "register">(tabParam === "register" ? "register" : "login");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });
      
      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to register");
        return;
      }

      // Auto login after successful registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (!loginRes?.error) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError("Account created but failed to auto-login");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="w-full max-w-md bg-surface/80 backdrop-blur border border-white/5 p-8 rounded-2xl shadow-2xl relative z-10">
      <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Home
      </Link>
      
      <div className="flex rounded-lg bg-black/20 p-1 mb-8">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "login" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-white"
          }`}
          onClick={() => { setActiveTab("login"); setError(null); }}
        >
          Sign In
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "register" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-white"
          }`}
          onClick={() => { setActiveTab("register"); setError(null); }}
        >
          Create Account
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={() => handleOAuth("google")}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium bg-[#ea4335]/10 hover:border-[#ea4335]/50 text-white"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        <button
          onClick={() => handleOAuth("github")}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium bg-[#333]/30 hover:border-[#fff]/30 text-white"
        >
          <Github size={20} />
          Continue with GitHub
        </button>
      </div>

      <div className="relative mb-6 flex items-center">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink-0 mx-4 text-text-muted text-sm">or continue with email</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  {...loginForm.register("email")}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-white placeholder:text-text-muted"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-400">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  {...loginForm.register("password")}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-white placeholder:text-text-muted"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-400">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-accent hover:bg-accent/80 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 mt-6"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                Sign In
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  {...registerForm.register("name")}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-white placeholder:text-text-muted"
                />
                {registerForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  {...registerForm.register("email")}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-white placeholder:text-text-muted"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  {...registerForm.register("phone")}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-white placeholder:text-text-muted"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  {...registerForm.register("password")}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-white placeholder:text-text-muted"
                />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  {...registerForm.register("confirmPassword")}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-white placeholder:text-text-muted"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-accent hover:bg-accent/80 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 mt-6"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                Create Account
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      
      <Suspense fallback={<div className="text-white"><Loader2 className="animate-spin" /></div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
