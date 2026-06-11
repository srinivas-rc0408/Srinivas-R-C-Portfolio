"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, FileJson } from "lucide-react";
import { toast } from "sonner";

const SECTIONS = [
  "resume", "projects", "cv", "skills", "experience",
  "education", "certifications", "open-source", "contact"
];

export default function ContentEditor() {
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent(selectedSection);
  }, [selectedSection]);

  const fetchContent = async (section: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?section=${section}`);
      const data = await res.json();
      if (res.ok) {
        setContent(data.content);
      } else {
        toast.error(data.error || "Failed to load content");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: selectedSection, content }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Content saved successfully!");
      } else {
        toast.error(data.error || "Failed to save content");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <FileJson className="w-5 h-5 text-accent" />
          </div>
          <h2 className="font-space text-xl font-bold text-white">Live Content Editor</h2>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent"
          >
            {SECTIONS.map(s => (
              <option key={s} value={s}>{s}.json</option>
            ))}
          </select>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-xl transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[500px] bg-black/30 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-accent resize-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
