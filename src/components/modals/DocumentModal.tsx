"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Download } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   UNIVERSAL DOCUMENT MODAL
   Glassmorphic AAA shell for viewing generated rewards/PDFs.
   ═══════════════════════════════════════════════════════════════ */

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
  updatedDate: string;
}

export default function DocumentModal({ isOpen, onClose, title, pdfUrl, updatedDate }: DocumentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-2xl p-4 md:p-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
            className="flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-red-900/40 bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
            {/* ── Header ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-black/50 px-6 py-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
                <span className="text-zinc-500">SRINIVAS R.C&apos;s</span> {title}
              </h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* ── PDF Viewer (Center Canvas) ── */}
            <div className="flex-1 overflow-y-auto bg-[#050508] p-4 sm:p-8 custom-scrollbar">
              <div className="relative h-full min-h-[600px] w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-900/50 flex items-center justify-center">
                {/* 
                  Production Note: 
                  Replace this placeholder with an actual <iframe src={pdfUrl} /> 
                  or react-pdf integration when assets are available.
                */}
                <div className="flex flex-col items-center gap-4 text-center opacity-50">
                  <FileIcon size={48} className="text-red-500" />
                  <div>
                    <div className="font-bold tracking-widest text-white uppercase">{title} Document Loaded</div>
                    <div className="text-xs text-zinc-500 mt-1">{pdfUrl}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Action Footer (Sticky Bottom) ── */}
            <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-black/80 px-6 py-4 backdrop-blur-md">
              
              <div className="text-xs font-semibold tracking-wide text-zinc-500">
                Updated on {updatedDate}
              </div>

              <div className="flex items-center gap-4">
                {/* Mail Button */}
                <motion.a
                  href="mailto:srinivasrc0408@gmail.com"
                  whileHover={{ y: -3, boxShadow: "0px 10px 20px rgba(220, 38, 38, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-300 transition-colors hover:border-red-500 hover:text-white"
                  title="Contact via Email"
                >
                  <Mail size={18} />
                </motion.a>

                {/* Download Button */}
                <motion.a
                  href={pdfUrl}
                  download
                  whileHover={{ y: -3, boxShadow: "0px 10px 20px rgba(220, 38, 38, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center rounded-lg border border-red-500/50 bg-red-500/10 p-2.5 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                  title="Download PDF"
                >
                  <Download size={18} />
                </motion.a>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple fallback icon for the PDF placeholder
function FileIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
