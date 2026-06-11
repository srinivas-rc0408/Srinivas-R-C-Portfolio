"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Gauge } from "lucide-react";

export default function PerformanceCharts() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real scenario, this would fetch from a new endpoint like /api/admin/vitals
    // For now, we simulate fetching aggregated vitals
    const fetchVitals = async () => {
      try {
        const res = await fetch("/api/admin/vitals");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Fallback to empty if not implemented yet
      } finally {
        setLoading(false);
      }
    };
    fetchVitals();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface border border-white/5 rounded-2xl p-6 h-[400px] flex items-center justify-center animate-pulse">
        <Gauge className="w-8 h-8 text-text-muted" />
      </div>
    );
  }

  if (data.length === 0) {
    return null; // Don't show if no vitals collected yet
  }

  // Helper to color bars based on rating
  const getBarColor = (name: string, value: number) => {
    // Thresholds: Good, Needs Improvement, Poor
    if (name === "FCP") return value < 1800 ? "#10b981" : value < 3000 ? "#f59e0b" : "#ef4444";
    if (name === "LCP") return value < 2500 ? "#10b981" : value < 4000 ? "#f59e0b" : "#ef4444";
    if (name === "FID") return value < 100 ? "#10b981" : value < 300 ? "#f59e0b" : "#ef4444";
    if (name === "CLS") return value < 0.1 ? "#10b981" : value < 0.25 ? "#f59e0b" : "#ef4444";
    if (name === "TTFB") return value < 800 ? "#10b981" : value < 1500 ? "#f59e0b" : "#ef4444";
    return "#6C63FF";
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-500/20 rounded-lg">
          <Gauge className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h2 className="font-space text-xl font-bold text-white">Web Vitals (Avg)</h2>
          <p className="text-text-muted text-xs">Real user performance metrics</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#000000", borderColor: "#ffffff20", borderRadius: "12px", color: "#fff" }}
              itemStyle={{ color: "#fff" }}
              cursor={{ fill: "#ffffff05" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.name, entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
