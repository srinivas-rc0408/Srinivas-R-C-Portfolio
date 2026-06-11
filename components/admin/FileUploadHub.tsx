"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FileUploadHub() {
  const [uploading, setUploading] = useState(false);
  const [recentUploads, setRecentUploads] = useState<string[]>([]);

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
  );
}
