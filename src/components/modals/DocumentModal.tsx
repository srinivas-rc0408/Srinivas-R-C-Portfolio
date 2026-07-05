"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Download, ChevronLeft, ChevronRight, FileX } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   UNIVERSAL DOCUMENT MODAL
   Glassmorphic PDF viewer shell shared by the Resume and CV popups.
   Fetches the Document row for `type`, then renders it via react-pdf.
   ═══════════════════════════════════════════════════════════════ */

const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[400px] items-center justify-center text-sm text-zinc-500">Loading viewer…</div>,
});

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "resume" | "cv";
}

interface DocumentData {
  fileUrl: string | null;
  isPublic: boolean;
  updatedAt: string;
}

const TITLES: Record<DocumentModalProps["type"], string> = { resume: "Resume", cv: "CV" };

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null));

function formatUpdatedDate(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(d);
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
  return `${date} (${day})`;
}

export default function DocumentModal({ isOpen, onClose, type }: DocumentModalProps) {
  const { data } = useSWR<DocumentData>(isOpen ? `/api/documents/${type}` : null, fetcher);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);

  const fileUrl = data?.fileUrl ?? null;

  const handleLoadSuccess = (loadedPages: number) => {
    setNumPages(loadedPages);
    setPageNumber(1);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const title = TITLES[type];

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
            onClick={(e) => e.stopPropagation()}
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

            {/* ── PDF Viewer ── */}
            <div className="flex-1 overflow-y-auto bg-[#050508] p-4 sm:p-8 custom-scrollbar">
              <div className="relative min-h-[600px] w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-900/50 flex items-center justify-center">
                {fileUrl ? (
                  <PdfViewer fileUrl={fileUrl} pageNumber={pageNumber} onLoadSuccess={handleLoadSuccess} />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center opacity-50">
                    <FileX size={48} className="text-red-500" />
                    <div className="font-bold tracking-widest text-white uppercase">{title} not uploaded yet</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Page Navigation ── */}
            {fileUrl && numPages > 0 && (
              <div className="flex shrink-0 items-center justify-center gap-4 border-t border-white/5 bg-black/40 py-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </motion.button>
                <span className="text-xs font-semibold tracking-wide text-zinc-400">
                  Page {pageNumber} / {numPages}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                  disabled={pageNumber >= numPages}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </motion.button>
              </div>
            )}

            {/* ── Action Footer ── */}
            <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-black/80 px-6 py-4 backdrop-blur-md">
              <div className="text-xs font-semibold tracking-wide text-zinc-500">
                {data?.updatedAt ? `Updated on ${formatUpdatedDate(data.updatedAt)}` : ""}
              </div>

              <div className="flex items-center gap-4">
                <motion.a
                  href="mailto:srinivasrc0408@gmail.com"
                  whileHover={{ y: -3, boxShadow: "0px 10px 20px rgba(220, 38, 38, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-300 transition-colors hover:border-red-500 hover:text-white"
                  title="Contact via Email"
                >
                  <Mail size={18} />
                </motion.a>

                <motion.a
                  href={fileUrl ?? undefined}
                  download
                  whileHover={fileUrl ? { y: -3, boxShadow: "0px 10px 20px rgba(220, 38, 38, 0.3)" } : undefined}
                  whileTap={fileUrl ? { scale: 0.9 } : undefined}
                  aria-disabled={!fileUrl}
                  className={`flex items-center justify-center rounded-lg border border-red-500/50 bg-red-500/10 p-2.5 text-red-500 transition-colors ${
                    fileUrl ? "hover:bg-red-500 hover:text-white" : "pointer-events-none opacity-30"
                  }`}
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
