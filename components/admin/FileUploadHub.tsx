"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, CheckCircle2, Loader2, Eye, EyeOff, FileText, Scroll } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface DocStatus {
  type: string;
  isPublic: boolean;
  fileUrl: string | null;
}

export default function FileUploadHub() {
  const [uploading, setUploading] = useState(false);
  const [recentUploads, setRecentUploads] = useState<string[]>([]);
  const [docs, setDocs] = useState<DocStatus[]>([]);
  const [togglingType, setTogglingType] = useState<string | null>(null);

  // Fetch current document states
  useEffect(() => {
    fetch("/api/admin/documents")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDocs(data);
      })
      .catch(() => {});
  }, []);

  const getDocStatus = (type: string): DocStatus | null => {
    return docs.find(d => d.type === type) || null;
  };

  const toggleVisibility = async (type: string) => {
    const current = getDocStatus(type);
    const newValue = current ? !current.isPublic : true;

    setTogglingType(type);
    try {
      const res = await fetch("/api/admin/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, isPublic: newValue }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDocs(prev => {
          const idx = prev.findIndex(d => d.type === type);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], isPublic: updated.isPublic };
            return copy;
          }
          return [...prev, { type: updated.type, isPublic: updated.isPublic, fileUrl: updated.fileUrl }];
        });
        toast.success("Visibility updated");
      } else {
        toast.error("Failed to update visibility");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setTogglingType(null);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("File uploaded successfully");
        setRecentUploads(prev => [data.fileName, ...prev]);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Network error during upload");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <div className="space-y-6">
      {/* Document Visibility Controls */}
      <div className="bg-surface border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Eye className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="font-space text-xl font-bold text-white">Document Visibility</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { type: "RESUME", label: "Resume", icon: FileText, accent: "violet" },
            { type: "CV", label: "CV", icon: Scroll, accent: "teal" },
          ].map(({ type, label, icon: Icon, accent }) => {
            const doc = getDocStatus(type);
            const isPublic = doc?.isPublic ?? false;
            const hasFile = !!doc?.fileUrl;
            const isToggling = togglingType === type;

            return (
              <div
                key={type}
                className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${isPublic ? `bg-${accent}-500/20` : "bg-white/5"}`}>
                    <Icon className={`w-5 h-5 ${isPublic ? `text-${accent}-400` : "text-text-muted"}`} />
                  </div>
                  <div>
                    <p className="font-space font-bold text-white text-sm">{label}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {!doc ? "Not configured" : hasFile ? (isPublic ? "Public" : "Private") : "No file uploaded"}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => toggleVisibility(type)}
                  disabled={isToggling}
                  className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  style={{
                    backgroundColor: isPublic ? "rgba(108,99,255,0.5)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
                    animate={{ left: isPublic ? 26 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {isToggling ? (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                    ) : isPublic ? (
                      <Eye className="w-3 h-3 text-accent" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400" />
                    )}
                  </motion.div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* File Upload Dropzone */}
      <div className="bg-surface border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <UploadCloud className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="font-space text-xl font-bold text-white">File Upload Hub</h2>
        </div>

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? "border-blue-500 bg-blue-500/10" 
              : isDragReject 
                ? "border-red-500 bg-red-500/10"
                : "border-white/10 hover:border-white/30 hover:bg-white/5"
          }`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
              <p className="text-white font-medium">Uploading file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-blue-400' : 'text-text-muted'}`} />
              {isDragActive ? (
                <p className="text-white font-medium">Drop the PDF here ...</p>
              ) : (
                <>
                  <p className="text-white font-medium mb-1">Drag & drop a PDF file here, or click to select</p>
                  <p className="text-text-muted text-sm">Only .pdf files up to 10MB are supported</p>
                </>
              )}
            </div>
          )}
        </div>

        {recentUploads.length > 0 && (
          <div className="mt-6">
            <h3 className="text-text-muted text-sm font-medium mb-3 uppercase tracking-wider">Recent Uploads</h3>
            <ul className="space-y-2">
              {recentUploads.map((fileName, i) => (
                <li key={i} className="flex items-center gap-3 p-3 bg-black/20 border border-white/5 rounded-lg">
                  <File className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-text-main flex-grow truncate">{fileName}</span>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
