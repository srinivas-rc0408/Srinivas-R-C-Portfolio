"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import RegisterPromptModal from "./RegisterPromptModal";

interface DownloadButtonProps {
  sectionSlug: string;
  sectionName: string;
}

export default function DownloadButton({ sectionSlug, sectionName }: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [showModal, setShowModal] = useState(false);

  const { data: session, status: sessionStatus } = useSession();

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
      success: "Download ready!",
      error: "Failed to download."
    });
  };

  return (
    <>
      <button 
        onClick={handleDownload}
        disabled={status !== "idle"}
        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
          status === "idle" ? "bg-surface border border-accent/30 hover:border-accent hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] text-white" :
          status === "loading" ? "bg-surface border border-white/10 text-text-muted cursor-not-allowed" :
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
