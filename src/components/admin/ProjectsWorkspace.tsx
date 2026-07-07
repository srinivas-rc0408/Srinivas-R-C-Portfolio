"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminStore } from "@/src/contexts/AdminStore";
import { Pencil, Link as LinkIcon, Check, X, UploadCloud, Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   PROJECTS WORKSPACE
   3-column Grid View with a smooth in-line Detailed Editor Mode
   integrating with the global Master Sync Staging queue.
   ═══════════════════════════════════════════════════════════════ */

interface Project {
  id: string;
  slug: string;
  title: string;
  shortInfo: string;
  longInfo: string;
  githubUrl: string;
  reportUrl: string | null;
  tags: string[];
  sortOrder: number;
  isVisible: boolean;
}

import { fetcher } from "@/lib/fetcher";

export default function ProjectsWorkspace() {
  const { addChange } = useAdminStore();
  const { data } = useSWR<Project[]>("/api/projects", fetcher);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Project | null>(null);

  // Seed local editable copy once — background revalidation shouldn't clobber an in-progress edit.
  // (React's "adjust state during render" pattern, not an effect — avoids a redundant paint.)
  if (data && projects === null) {
    setProjects(data);
  }

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditState({ ...project });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditState(null);
  };

  const confirmEditing = () => {
    if (!editState) return;

    setProjects((prev) => prev?.map((p) => (p.id === editState.id ? editState : p)) ?? null);

    addChange({
      id: `proj-${editState.slug}`,
      section: "Projects",
      field: editState.title,
      status: "Modified",
      payload: {
        slug: editState.slug,
        title: editState.title,
        shortInfo: editState.shortInfo,
        longInfo: editState.longInfo,
        githubUrl: editState.githubUrl,
        reportUrl: editState.reportUrl,
        tags: editState.tags,
        sortOrder: editState.sortOrder,
        isVisible: editState.isVisible,
      },
    });

    setEditingId(null);
    setEditState(null);
  };

  const handleFieldChange = (field: keyof Project, value: string) => {
    if (editState) {
      setEditState({ ...editState, [field]: value });
    }
  };

  if (projects === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <AnimatePresence>
        {projects.map((project) => {
          const isEditing = editingId === project.id;

          return (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex flex-col overflow-hidden rounded-2xl border transition-colors ${
                isEditing ? "border-red-500/50 bg-black shadow-[0_0_30px_rgba(220,38,38,0.15)] col-span-1 md:col-span-2 xl:col-span-3" : "border-white/10 bg-zinc-900/30 hover:border-white/20"
              }`}
            >
              {isEditing && editState ? (
                /* ── IN-LINE DETAILED EDITOR ── */
                <div className="flex flex-col gap-6 p-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <input
                      type="text"
                      value={editState.title}
                      onChange={(e) => handleFieldChange("title", e.target.value)}
                      className="bg-transparent text-2xl font-bold text-white outline-none placeholder:text-zinc-600 w-full"
                      placeholder="Project Title"
                    />
                    <div className="flex items-center gap-2">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={cancelEditing} className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white">
                        <X size={16} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={confirmEditing} className="flex h-8 w-8 items-center justify-center rounded bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                        <Check size={16} strokeWidth={3} />
                      </motion.button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Short Info (Card View Preview)</label>
                        <input
                          type="text"
                          value={editState.shortInfo}
                          onChange={(e) => handleFieldChange("shortInfo", e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-sm text-white outline-none focus:border-red-500 transition-colors"
                          placeholder="Brief 1-2 line summary..."
                        />
                      </div>

                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Long Info (Markdown Write-up)</label>
                        <textarea
                          value={editState.longInfo}
                          onChange={(e) => handleFieldChange("longInfo", e.target.value)}
                          className="w-full flex-1 resize-none rounded-lg border border-white/10 bg-black/50 p-4 text-sm text-white outline-none focus:border-red-500 transition-colors min-h-[150px]"
                          placeholder="Long-form technical breakdown..."
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Repository Link</label>
                        <div className="relative">
                          <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            value={editState.githubUrl}
                            onChange={(e) => handleFieldChange("githubUrl", e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-black/50 pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-red-500 transition-colors"
                            placeholder="https://github.com/..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* PDF Staging Zone — report upload lands in a later phase */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Upload report in form of PDF <span className="text-zinc-600 normal-case">(coming soon)</span>
                      </label>
                      <div className="pointer-events-none flex h-full min-h-[200px] cursor-not-allowed flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] opacity-40">
                        <UploadCloud size={32} className="text-zinc-600 mb-3" />
                        <span className="text-sm font-medium text-zinc-300">Drag & Drop PDF Here</span>
                        <span className="text-xs text-zinc-600 mt-1">
                          {editState.reportUrl ? "A report is already on file" : "or click to browse"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── STANDARD CARD VIEW ── */
                <div className="flex flex-col h-full p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{project.title}</h3>
                    {project.githubUrl && (
                      <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400">
                        <LinkIcon size={10} /> Link
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 flex-1 line-clamp-2">{project.shortInfo}</p>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startEditing(project)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
                    >
                      <Pencil size={12} /> Edit Details
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
