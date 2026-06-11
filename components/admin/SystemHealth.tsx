"use client";

import { useEffect, useState } from "react";
import { Activity, Cpu, Clock, Users, ArrowUpRight } from "lucide-react";

interface HealthData {
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    percentUsed: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  recentLogins: number;
  totalUsers: number;
  totalViews: number;
}

export default function SystemHealth() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/admin/health");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch system health", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    // Poll every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-surface border border-white/5 rounded-2xl p-6 h-64 flex items-center justify-center animate-pulse">
        <Activity className="w-8 h-8 text-text-muted" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="font-space text-xl font-bold text-white">System Health</h2>
        <span className="ml-auto flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Memory Usage */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm font-medium flex items-center gap-2">
              <Cpu className="w-4 h-4" /> RAM Usage
            </span>
            <span className={`text-sm font-bold ${data.memory.percentUsed > 80 ? 'text-red-400' : 'text-emerald-400'}`}>
              {data.memory.percentUsed}%
            </span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full ${data.memory.percentUsed > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${data.memory.percentUsed}%` }}
            />
          </div>
          <p className="text-xs text-text-muted text-right">
            {data.memory.heapUsedMB} MB / {data.memory.heapTotalMB} MB
          </p>
        </div>

        {/* Uptime */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Server Uptime
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-space font-bold text-white">{data.uptime.formatted}</span>
          </div>
        </div>

        {/* Recent Logins */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> 24h Signups
            </span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-space font-bold text-white">+{data.recentLogins}</span>
            <span className="text-xs text-text-muted">users</span>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" /> Total Views
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-space font-bold text-white">{data.totalViews.toLocaleString()}</span>
            <span className="text-xs text-text-muted">hits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
