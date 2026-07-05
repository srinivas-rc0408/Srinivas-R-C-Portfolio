"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Download, MoreHorizontal } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CERTIFICATE DETAIL MODAL
   Image popup shown when a certification card is clicked.
   ═══════════════════════════════════════════════════════════════ */

interface Certificate {
  id: string;
  name: string;
  imageUrl: string;
  completedYear: number;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
}

export default function CertificateModal({ isOpen, onClose, certificate }: CertificateModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && certificate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-2xl p-4 md:p-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-red-900/40 bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
            <div className="flex-1 overflow-y-auto bg-[#050508] p-6 custom-scrollbar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={certificate.imageUrl}
                alt={certificate.name}
                className="w-full rounded-xl border border-white/10 object-contain"
              />
              <h3 className="mt-6 text-xl font-bold text-white">{certificate.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">Completed on {certificate.completedYear}</p>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-black/80 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="More options"
                >
                  <MoreHorizontal size={18} />
                </motion.button>
                <motion.a
                  href={certificate.imageUrl}
                  download
                  whileTap={{ scale: 0.9 }}
                  className="rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Download"
                >
                  <Download size={18} />
                </motion.a>
                <motion.a
                  href="mailto:srinivasrc0408@gmail.com"
                  whileTap={{ scale: 0.9 }}
                  className="rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Contact via Email"
                >
                  <Mail size={18} />
                </motion.a>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="rounded-lg bg-red-500 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-600"
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
