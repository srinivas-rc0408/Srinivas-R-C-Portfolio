"use client";

import { X } from "lucide-react";
import Link from "next/link";

interface RegisterPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterPromptModal({ isOpen, onClose }: RegisterPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-[12px] px-4">
      <div className="bg-surface border border-accent/30 rounded-2xl p-8 max-w-md w-full relative shadow-[0_10px_40px_rgba(108,99,255,0.15)]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <h2 className="font-space text-2xl font-bold text-white mb-4">Create a free account to download</h2>
        <p className="text-text-muted mb-8">
          It takes 30 seconds. You&apos;ll get access to download all sections with your name watermarked.
        </p>

        <div className="flex flex-col gap-4">
          <Link 
            href="/login?tab=register"
            className="w-full py-3 bg-accent hover:bg-accent/80 text-white font-medium rounded-xl transition-colors text-center"
          >
            Create Account
          </Link>
          <Link 
            href="/login"
            className="w-full py-3 bg-transparent border border-white/10 hover:border-white/30 text-white font-medium rounded-xl transition-colors text-center"
          >
            Already have one? Log in
          </Link>
          <button 
            onClick={onClose}
            className="w-full py-2 mt-2 text-text-muted hover:text-white text-sm transition-colors text-center"
          >
            Maybe later (Continue as guest)
          </button>
        </div>
      </div>
    </div>
  );
}
