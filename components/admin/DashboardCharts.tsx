"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface DashboardChartsProps {
  viewData: { name: string; views: number }[];
  gameData: { name: string; sessions: number }[];
}

export default function DashboardCharts({ viewData, gameData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      {/* Page Views Chart */}
      <div className="bg-surface border border-white/5 p-6 rounded-2xl shadow-xl">
        <h3 className="font-space text-xl font-bold text-white mb-6">Page Views by Section</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#8888BB" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8888BB" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                itemStyle={{ color: "#fff" }}
              />
              <Line type="monotone" dataKey="views" stroke="#6C63FF" strokeWidth={3} dot={{ r: 4, fill: "#6C63FF", strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Game Sessions Chart */}
      <div className="bg-surface border border-white/5 p-6 rounded-2xl shadow-xl">
        <h3 className="font-space text-xl font-bold text-white mb-6">Vehicle Choice Popularity</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gameData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#8888BB" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8888BB" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{ backgroundColor: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
              />
              <Bar dataKey="sessions" fill="#FF6584" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
