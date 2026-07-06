"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminStore } from "@/src/contexts/AdminStore";
import {
  Menu,
  Search,
  Info,
  AlertTriangle,
  FolderKanban,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Activity,
  Share2,
  Users,
  Mail,
} from "lucide-react";

interface FeedbackRow {
  isRead: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ═══════════════════════════════════════════════════════════════
   ADMIN LAYOUT SHELL
   The core workspace wrapper providing the top header, the
   pending changes staging drop-down, and the collapsible sidebar.
   ═══════════════════════════════════════════════════════════════ */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab, pendingChanges, clearChanges } = useAdminStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { data: feedback } = useSWR<FeedbackRow[]>("/api/feedback", fetcher);
  const unreadFeedbackCount = feedback?.filter((f) => !f.isRead).length ?? 0;

  const handleUpdateAll = async () => {
    if (pendingChanges.length === 0) return;
    setIsSyncing(true);
    setIsInfoOpen(false);
    
    try {
      // Find socials change
      const socialsChange = pendingChanges.find(c => c.id === "socials");
      if (socialsChange) {
        await fetch("/api/socials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ socials: socialsChange.payload })
        });
      }

      // Bulk-upsert staged project edits
      const projectChanges = pendingChanges.filter(c => c.section === "Projects");
      if (projectChanges.length > 0) {
        await fetch("/api/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectChanges.map(c => c.payload)),
        });
      }

      clearChanges();
    } catch (err) {
      console.error("Failed to sync changes:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { id: "Projects", icon: <FolderKanban size={16} /> },
    { id: "Education", icon: <GraduationCap size={16} /> },
    { id: "Experience", icon: <Briefcase size={16} /> },
    { id: "Achievements", icon: <Award size={16} /> },
    { id: "Certificates", icon: <Award size={16} /> },
    { id: "Resume", icon: <FileText size={16} /> },
    { id: "CV", icon: <FileText size={16} /> },
    { id: "Socials & Footer", icon: <Share2 size={16} /> },
    { id: "Downloads", icon: <Users size={16} /> },
    { id: "Feedback", icon: <Mail size={16} /> },
  ];

  return (
    <div className="flex h-screen w-full bg-[#050508] text-white overflow-hidden font-sans">
      
      {/* ── Collapsible Sidebar ── */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex h-full shrink-0 flex-col border-r border-white/5 bg-zinc-950/50"
          >
            <div className="flex h-16 items-center px-6 border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Workspace</span>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === item.id ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  }`}
                >
                  {item.icon}
                  {item.id}
                  {item.id === "Feedback" && unreadFeedbackCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadFeedbackCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Workspace Area ── */}
      <main className="flex flex-1 flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950/80 px-6 backdrop-blur-md">
          
          {/* Left: Sidebar Trigger & Search */}
          <div className="flex flex-1 items-center gap-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </motion.button>
            <div className="relative w-64 hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search data..."
                className="w-full rounded-full border border-white/10 bg-black/50 py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Right: Controls & Profile */}
          <div className="flex flex-1 items-center justify-end gap-5">
            
            {/* Info Dropdown Toggle */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsInfoOpen(!isInfoOpen)}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${pendingChanges.length > 0 ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/5 text-zinc-400 hover:text-white"}`}
              >
                <Info size={16} />
                {pendingChanges.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {pendingChanges.length}
                  </span>
                )}
              </motion.button>

              {/* Pending Changes Dropdown Panel */}
              <AnimatePresence>
                {isInfoOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-10 w-72 rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-2xl z-50"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 border-b border-white/5 pb-2">Pending Staging Area</h4>
                    <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                      {pendingChanges.length === 0 ? (
                        <p className="text-xs text-zinc-600 italic">No modifications detected.</p>
                      ) : (
                        pendingChanges.map((change) => (
                          <div key={change.id} className="flex items-start justify-between rounded bg-white/5 p-2 text-[10px]">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-200">{change.section}</span>
                              <span className="text-zinc-500">{change.field}</span>
                            </div>
                            <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-bold uppercase tracking-wider text-red-500">
                              {change.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Master Update Button */}
            <motion.button
              whileTap={{ scale: pendingChanges.length > 0 ? 0.95 : 1 }}
              onClick={handleUpdateAll}
              disabled={pendingChanges.length === 0 || isSyncing}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
                pendingChanges.length > 0
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  : "bg-white/5 text-zinc-600 cursor-not-allowed"
              }`}
            >
              {isSyncing ? "Syncing..." : "Update Changes All"}
            </motion.button>

            {/* Admin Warning Badge */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-amber-500 uppercase">
              <AlertTriangle size={12} />
              Admin △
            </div>

            {/* Profile Thumbnail */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="hidden lg:flex flex-col items-end text-[10px]">
                <span className="font-bold text-zinc-200 uppercase tracking-widest">SrinivasRC</span>
                <span className="text-zinc-600">Bengaluru</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center overflow-hidden">
                <span className="text-xs font-bold text-zinc-500">SRC</span>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Children */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 relative">
            {children}
          </div>

          {/* Dedicated Event Log Panel */}
          <aside className="w-64 shrink-0 border-l border-white/5 bg-zinc-950/30 p-6 hidden xl:block">
            <h3 className="mb-6 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
              <Activity size={12} /> Event Log
            </h3>
            <div className="flex flex-col gap-3">
               <div className="flex flex-col gap-1 rounded border border-white/5 bg-white/[0.02] p-3 text-[10px]">
                 <span className="font-bold text-zinc-300">System Initialization</span>
                 <span className="font-mono text-zinc-600">[{new Date().toLocaleTimeString()}]</span>
               </div>
               {pendingChanges.map(change => (
                 <div key={change.id} className="flex flex-col gap-1 rounded border border-red-500/20 bg-red-500/5 p-3 text-[10px]">
                   <span className="font-bold text-red-400">Staged: {change.section}</span>
                   <span className="font-mono text-zinc-600">[{new Date().toLocaleTimeString()}]</span>
                 </div>
               ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
