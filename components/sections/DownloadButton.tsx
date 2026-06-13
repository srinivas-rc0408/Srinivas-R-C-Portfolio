"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle2, Lock, FileX } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import RegisterPromptModal from "./RegisterPromptModal";

interface DownloadButtonProps {
  sectionSlug: string;
  sectionName: string;
}

// Sections that map to controlled document types
const DOC_TYPE_MAP: Record<string, string> = {
  resume: "RESUME",
  cv: "CV",
};

interface DocStatus {
  exists: boolean;
  isPublic: boolean;
  hasFile: boolean;
}

export default function DownloadButton({ sectionSlug, sectionName }: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [showModal, setShowModal] = useState(false);
  const [docStatus, setDocStatus] = useState<DocStatus | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  const { data: session, status: sessionStatus } = useSession();

  const docType = DOC_TYPE_MAP[sectionSlug];

  // Fetch document status for resume/cv sections
  useEffect(() => {
    if (!docType) return;

    setDocLoading(true);
    fetch(`/api/documents?type=${docType}`)
      .then(res => res.json())
      .then(data => setDocStatus(data))
      .catch(() => setDocStatus({ exists: false, isPublic: false, hasFile: false }))
      .finally(() => setDocLoading(false));
  }, [docType]);

  const handleDownload = async () => {
    if (sessionStatus === "unauthenticated") {
      setShowModal(true);
      return;
    }

    setStatus("loading");

    const downloadTask = fetch(`/api/download/${sectionSlug}`, { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SrinivasRC_${sectionSlug}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setStatus("success");
        setTimeout(() => setStatus("idle"), 5000);
      })
      .catch((err) => {
        setStatus("idle");
        throw err;
      });

    toast.promise(downloadTask, {
      loading: "Generating Watermark...",
      success: "Download Complete",
      error: "Failed to download."
    });
  };

  // For Resume/CV: Check document access control
  if (docType) {
    // Still loading doc status
    if (docLoading) {
      return (
        <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/[0.01] backdrop-blur-md border border-white/5">
          <Loader2 size={18} className="animate-spin text-text-muted" />
          <span className="text-text-muted text-sm">Checking availability...</span>
        </div>
      );
    }

    // Scenario B: No document exists / fileUrl is null
    if (docStatus && (!docStatus.exists || !docStatus.hasFile)) {
      return (
        <div className="flex items-center gap-4 px-6 py-4 rounded-xl bg-white/[0.01] backdrop-blur-md border border-white/5 shadow-[0_0_20px_rgba(245,158,11,0.06)]">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <FileX size={20} className="text-amber-400/70" />
          </div>
          <div>
            <p className="text-white/70 font-medium text-sm">No docs found</p>
            <p className="text-white/40 text-xs mt-1">
              <a href="mailto:srinivasrc0408@gmail.com" className="text-amber-400/70 hover:text-amber-300 transition-colors underline underline-offset-2">Contact admin</a> to see or upload
            </p>
          </div>
        </div>
      );
    }

    // Scenario A: Document exists but isPublic is false (private)
    if (docStatus && !docStatus.isPublic) {
      return (
        <div className="flex items-center gap-4 px-6 py-4 rounded-xl bg-white/[0.01] backdrop-blur-md border border-white/5 shadow-[0_0_20px_rgba(239,68,68,0.06)]">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Lock size={20} className="text-red-400/70" />
          </div>
          <div>
            <p className="text-white/50 font-medium text-sm">Srinivas R C has made it private.</p>
          </div>
        </div>
      );
    }

    // Scenario C: Document exists and isPublic — fall through to normal button
  }

  // Normal download button (Scenario C or non-resume/cv sections)
  return (
    <>
      <button 
        onClick={handleDownload}
        disabled={status !== "idle"}
        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 min-h-[44px] ${
          status === "idle" ? "bg-white/[0.02] backdrop-blur-md border border-accent/30 hover:border-accent hover:shadow-[0_0_20px_rgba(108,99,255,0.4)] text-white" :
          status === "loading" ? "bg-white/[0.01] border border-white/10 text-text-muted cursor-not-allowed" :
          "bg-green-500/20 border border-green-500/50 text-green-400"
        }`}
      >
        {status === "idle" && <Download size={20} />}
        {status === "loading" && <Loader2 size={20} className="animate-spin" />}
        {status === "success" && <CheckCircle2 size={20} />}
        
        <span>
          {status === "idle" && `Download ${sectionName}`}
          {status === "loading" && "Generating Watermark..."}
          {status === "success" && "Downloaded!"}
        </span>
      </button>

      <RegisterPromptModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}
