"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Eye, UploadCloud, X, Lock, Unlock } from "lucide-react";
import DocumentModal from "@/src/components/modals/DocumentModal";

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT WORKSPACE (Resume / CV)
   View current, upload new (presigned direct-to-R2 with progress),
   toggle public/private. Writes go straight to the DB — no staging.
   ═══════════════════════════════════════════════════════════════ */

interface DocumentWorkspaceProps {
  type: "resume" | "cv";
}

interface DocumentData {
  fileUrl: string | null;
  isPublic: boolean;
  updatedAt: string;
}

const LABELS: Record<DocumentWorkspaceProps["type"], string> = { resume: "Resume", cv: "CV" };
const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null));

export default function DocumentWorkspace({ type }: DocumentWorkspaceProps) {
  const { data, mutate } = useSWR<DocumentData>(`/api/documents/${type}`, fetcher);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File exceeds 15MB limit.");
      return;
    }

    setError("");
    setProgress(0);

    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, kind: type, size: file.size }),
      });
      if (!presignRes.ok) throw new Error((await presignRes.json()).error || "Failed to get upload URL.");
      const { uploadUrl, publicUrl } = await presignRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed.")));
        xhr.onerror = () => reject(new Error("Upload failed."));
        xhr.onabort = () => reject(new Error("Upload cancelled."));
        xhr.send(file);
      });

      await fetch(`/api/documents/${type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: publicUrl }),
      });

      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
      xhrRef.current = null;
    }
  };

  const togglePrivate = async () => {
    await fetch(`/api/documents/${type}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !data?.isPublic }),
    });
    await mutate();
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-2xl font-bold text-white tracking-wide">{LABELS[type]}</h2>
        <p className="text-sm text-zinc-500 mt-1">Manage the public {LABELS[type]} document.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/30 p-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-white">
            {data?.fileUrl ? "Document uploaded" : "No document uploaded yet"}
          </span>
          {data?.updatedAt && (
            <span className="text-xs text-zinc-500">Updated {new Date(data.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={!data?.fileUrl}
          onClick={() => setViewerOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Eye size={14} /> View Current
        </motion.button>
      </div>

      <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] transition-colors hover:border-red-500/50 hover:bg-red-500/5">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={progress !== null}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {progress !== null ? (
          <div className="flex w-full max-w-xs items-center gap-3 px-6">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold text-zinc-400">{progress}%</span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                xhrRef.current?.abort();
              }}
              className="rounded p-1 text-zinc-500 hover:text-white"
            >
              <X size={14} />
            </motion.button>
          </div>
        ) : (
          <>
            <UploadCloud size={28} className="text-zinc-600" />
            <span className="text-sm font-medium text-zinc-300">Upload New {LABELS[type]}</span>
            <span className="text-xs text-zinc-600">PDF up to 15MB</span>
          </>
        )}
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}

      <motion.button
        whileTap={{ scale: 0.98 }}
        disabled={!data}
        onClick={togglePrivate}
        className={`flex items-center justify-center gap-2 self-start rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-30 ${
          data?.isPublic ? "bg-white/5 text-zinc-400 hover:bg-white/10" : "bg-emerald-500/10 text-emerald-400"
        }`}
      >
        {data?.isPublic ? <Lock size={14} /> : <Unlock size={14} />}
        {data?.isPublic ? "Make Private" : "Make Public"}
      </motion.button>

      <DocumentModal isOpen={viewerOpen} onClose={() => setViewerOpen(false)} type={type} />
    </div>
  );
}
