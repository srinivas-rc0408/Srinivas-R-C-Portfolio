"use client";

import { useEffect, useState } from "react";
import { Activity, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/activity");
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch activity logs", e);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && logs.length === 0) {
    return (
      <div className="bg-surface border border-white/5 rounded-2xl p-6 h-64 flex items-center justify-center animate-pulse">
        <Activity className="w-8 h-8 text-text-muted" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6 flex flex-col h-full max-h-[600px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="font-space text-xl font-bold text-white">Global Activity Feed</h2>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {logs.length === 0 ? (
          <p className="text-text-muted text-center text-sm mt-10">No recent activity.</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-4 items-start relative pb-4">
              {i !== logs.length - 1 && (
                <div className="absolute top-8 bottom-0 left-[11px] w-[2px] bg-white/5" />
              )}
              <div className="relative z-10 w-6 h-6 rounded-full bg-black border-2 border-white/10 flex items-center justify-center shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium leading-snug">{log.action}</p>
                <div className="flex items-center gap-1 mt-1 text-text-muted text-xs">
                  <Clock size={12} />
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
