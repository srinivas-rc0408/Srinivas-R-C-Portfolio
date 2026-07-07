"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Lock, Check } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CERTIFICATES WORKSPACE
   Grid + upload + multi-select "Make Private" with confirm popup.
   Writes go straight to the DB — no staging.
   ═══════════════════════════════════════════════════════════════ */

interface Certificate {
  id: string;
  name: string;
  imageUrl: string;
  completedYear: number;
  isPublic: boolean;
}

import { fetcher } from "@/lib/fetcher";

export default function CertificatesWorkspace() {
  const { data, mutate } = useSWR<Certificate[]>("/api/certificates", fetcher);
  const certs = data ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ponytail: name/year collected via prompt() — swap for inline form fields if this needs richer UX
  const handleUpload = async (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Only PNG, JPG, or WEBP images are allowed.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File exceeds 15MB limit.");
      return;
    }
    const name = window.prompt("Certificate name?");
    if (!name) return;
    const yearStr = window.prompt("Completed year?", String(new Date().getFullYear()));
    const year = Number(yearStr);
    if (!yearStr || Number.isNaN(year)) return;

    setError("");
    setUploading(true);
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, kind: "certificate", size: file.size }),
      });
      if (!presignRes.ok) throw new Error((await presignRes.json()).error || "Failed to get upload URL.");
      const { uploadUrl, publicUrl } = await presignRes.json();

      const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) throw new Error("Upload failed.");

      await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, imageUrl: publicUrl, completedYear: year, sortOrder: certs.length }),
      });

      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmMakePrivate = async () => {
    await fetch("/api/certificates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), isPublic: false }),
    });
    setSelected(new Set());
    setConfirmOpen(false);
    await mutate();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Certificates</h2>
          <p className="text-sm text-zinc-500 mt-1">Manage public certification images.</p>
        </div>
        {selected.size > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-600"
          >
            <Lock size={14} /> Make Private ({selected.size})
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {certs.map((cert) => {
          const isSelected = selected.has(cert.id);
          return (
            <motion.div
              key={cert.id}
              onClick={() => toggleSelect(cert.id)}
              className={`relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border transition-colors ${
                isSelected ? "border-red-500" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cert.imageUrl})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              {!cert.isPublic && (
                <span className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-400">
                  Private
                </span>
              )}
              {isSelected && (
                <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-xs font-bold text-white truncate">{cert.name}</p>
                <p className="text-[10px] text-zinc-400">{cert.completedYear}</p>
              </div>
            </motion.div>
          );
        })}

        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] transition-colors hover:border-red-500/50 hover:bg-red-500/5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <UploadCloud size={24} className="text-zinc-600" />
          <span className="text-xs font-medium text-zinc-400">{uploading ? "Uploading…" : "Add Certificate"}</span>
        </label>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmOpen(false)}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6"
            >
              <h3 className="text-lg font-bold text-white">Make Private?</h3>
              <p className="mt-2 text-sm text-zinc-400">
                {selected.size} certificate{selected.size !== 1 ? "s" : ""} will be hidden from the public site.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMakePrivate}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-600"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
