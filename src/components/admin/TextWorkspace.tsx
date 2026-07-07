"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAdminStore } from "@/src/contexts/AdminStore";
import { CheckCircle2, History } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TEXT WORKSPACE
   A unified templating engine for text-heavy sections (Education,
   Experience, Achievements) with conditional commit states.
   ═══════════════════════════════════════════════════════════════ */

interface TextWorkspaceProps {
  sectionTitle: string;
}

const MOCK_DATA: Record<string, string> = {
  "Education": "B.Tech in Computer Science from Visvesvaraya Technological University (VTU).\nGraduated with First Class Distinction.\n\nKey Coursework: Data Structures, Machine Learning, Operating Systems.",
  "Experience": "Senior Full-Stack Architect @ Tech Solutions (2021 - Present)\n- Led the migration of legacy systems to Next.js App Router.\n- Architected a custom ORM layer in Node.js.\n\nSoftware Engineer @ StartUp Inc (2019 - 2021)\n- Developed real-time dashboard using WebSockets and React.",
  "Achievements": "1st Place - Global AI Hackathon 2023\nAWS Certified Solutions Architect - Associate\nPublished Paper: 'Agentic Orchestration in Distributed Systems'",
  "Certificates": "Google Cloud Professional Developer\nMeta Frontend Developer Professional Certificate",
  "Resume": "https://srinivasrc.com/assets/Resume.pdf\n[A specialized PDF drag-and-drop zone would go here for Resume/CV]",
  "CV": "https://srinivasrc.com/assets/CV.pdf\n[A specialized PDF drag-and-drop zone would go here for Resume/CV]"
};

export default function TextWorkspace({ sectionTitle }: TextWorkspaceProps) {
  const { addChange } = useAdminStore();
  
  const originalText = MOCK_DATA[sectionTitle] || "No existing data found.";
  const [currentText, setCurrentText] = useState(originalText);
  const [isModified, setIsModified] = useState(false);
  const [hasStaged, setHasStaged] = useState(false);

  // Reset state when the tab changes (React's "adjust state during render"
  // pattern, not an effect — avoids a redundant paint of the stale tab's text).
  const [prevSectionTitle, setPrevSectionTitle] = useState(sectionTitle);
  if (sectionTitle !== prevSectionTitle) {
    setPrevSectionTitle(sectionTitle);
    setCurrentText(MOCK_DATA[sectionTitle] || "");
    setIsModified(false);
    setHasStaged(false);
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setCurrentText(newVal);
    setIsModified(newVal !== originalText);
    setHasStaged(false); // Reset staging status if they keep typing
  };

  const stageChanges = () => {
    if (!isModified) return;

    addChange({
      id: `text-${sectionTitle.toLowerCase()}`,
      section: sectionTitle,
      field: "Body Text",
      status: "Modified",
      payload: currentText
    });

    setHasStaged(true);
    setIsModified(false); // Visually disable the button since it's already staged
  };

  const handleReset = () => {
    setCurrentText(originalText);
    setIsModified(false);
    setHasStaged(false);
  };

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">{sectionTitle} Configuration</h2>
          <p className="text-sm text-zinc-500 mt-1">Manage the raw text data for the {sectionTitle} public section.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            disabled={!isModified && !hasStaged}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            <History size={14} /> Revert
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={stageChanges}
            disabled={!isModified}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              isModified 
                ? "bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:bg-red-600" 
                : hasStaged 
                  ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" 
                  : "bg-white/5 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {hasStaged ? (
              <>
                <CheckCircle2 size={14} /> Staged for Sync
              </>
            ) : (
              "Stage Changes"
            )}
          </motion.button>
        </div>
      </div>

      {/* Unified Text Area */}
      <div className="flex flex-col relative rounded-2xl border border-white/10 bg-zinc-900/30 p-1 overflow-hidden transition-colors focus-within:border-red-500/50 focus-within:shadow-[0_0_20px_rgba(220,38,38,0.1)]">
        <div className="bg-black/40 px-4 py-2 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Markdown / Plain Text Editor</span>
          {isModified && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
        </div>
        <textarea
          value={currentText}
          onChange={handleTextChange}
          className="w-full min-h-[400px] resize-y bg-transparent p-6 text-sm leading-relaxed text-zinc-200 outline-none"
          placeholder={`Enter the details for ${sectionTitle}...`}
        />
      </div>

    </div>
  );
}
