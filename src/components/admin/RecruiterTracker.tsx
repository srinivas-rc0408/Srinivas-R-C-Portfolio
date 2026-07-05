"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Users, Building2, FileText, Clock } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   RECRUITER TRACKER
   DownloadLog table — who, what, when, company guess. Newest first.
   Adapted from the main-branch RecruiterTracker component.
   ═══════════════════════════════════════════════════════════════ */

interface DownloadLogRow {
  id: string;
  section: string;
  fileName: string;
  downloadedAt: string;
  ipAddress: string | null;
  estimatedCompany: string | null;
  user: { name: string; email: string } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RecruiterTracker() {
  const { data } = useSWR<DownloadLogRow[]>("/api/downloads", fetcher);
  const logs = useMemo(() => data ?? [], [data]);
  const [section, setSection] = useState("all");
  const [query, setQuery] = useState("");

  const sections = useMemo(() => Array.from(new Set(logs.map((l) => l.section))), [logs]);

  const filtered = logs.filter((log) => {
    if (section !== "all" && log.section !== section) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      log.user?.name.toLowerCase().includes(q) ||
      log.user?.email.toLowerCase().includes(q) ||
      log.estimatedCompany?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-white/5 pb-6">
        <h2 className="flex items-center gap-3 text-2xl font-bold tracking-wide text-white">
          <Users size={22} className="text-red-500" /> Recruiter Intelligence
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Every watermarked download, newest first.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-red-500"
        >
          <option value="all">All sections</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or company…"
          className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-red-500"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/30">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Company Guess</th>
              <th className="px-4 py-3">File</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-zinc-600">
                  No downloads recorded yet.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Clock size={12} /> {new Date(log.downloadedAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{log.user?.name ?? "Unknown"}</p>
                    <p className="text-xs text-zinc-500">{log.user?.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Building2 size={13} className="text-red-500" />
                      {log.estimatedCompany ?? log.ipAddress ?? "Unknown"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs">
                      <FileText size={13} className="text-zinc-500" />
                      <span className="font-mono text-red-400">{log.fileName}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
