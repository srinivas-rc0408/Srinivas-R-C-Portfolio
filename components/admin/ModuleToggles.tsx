"use client";

import { useState, useEffect } from "react";
import { Settings2, Gamepad2, Dice5, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SiteConfigKeys } from "@/lib/config";

export default function ModuleToggles() {
  const [config, setConfig] = useState<Record<SiteConfigKeys, boolean> | null>(null);
  const [updating, setUpdating] = useState<SiteConfigKeys | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => toast.error("Failed to load config"));
  }, []);

  const toggle = async (key: SiteConfigKeys) => {
    if (!config) return;
    
    setUpdating(key);
    const newValue = !config[key];
    
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue.toString() }),
      });
      
      if (res.ok) {
        setConfig({ ...config, [key]: newValue });
        toast.success(`Module updated`);
      } else {
        toast.error("Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdating(null);
    }
  };

  if (!config) {
    return (
      <div className="bg-surface border border-white/5 rounded-2xl p-6 h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Settings2 className="w-5 h-5 text-orange-400" />
        </div>
        <h2 className="font-space text-xl font-bold text-white">Global Modules</h2>
      </div>

      <div className="space-y-4">
        {/* Game Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-lg">
              <Gamepad2 className="w-5 h-5 text-text-muted" />
            </div>
            <div>
              <h3 className="text-white font-medium">3D Vehicle Navigation</h3>
              <p className="text-sm text-text-muted">Allow users to access the /game map route</p>
            </div>
          </div>
          <button 
            onClick={() => toggle("gameEnabled")}
            disabled={updating !== null}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.gameEnabled ? 'bg-accent' : 'bg-white/20'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.gameEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Gamble Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-lg">
              <Dice5 className="w-5 h-5 text-text-muted" />
            </div>
            <div>
              <h3 className="text-white font-medium">Gamble Modal</h3>
              <p className="text-sm text-text-muted">Enable the random section spinner on the homepage</p>
            </div>
          </div>
          <button 
            onClick={() => toggle("gambleEnabled")}
            disabled={updating !== null}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.gambleEnabled ? 'bg-accent' : 'bg-white/20'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.gambleEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-8">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-red-400 font-medium">Global Kill-Switch (Maintenance Mode)</h3>
              <p className="text-sm text-red-400/70">Locks down the entire public site instantly</p>
            </div>
          </div>
          <button 
            onClick={() => toggle("maintenanceMode")}
            disabled={updating !== null}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.maintenanceMode ? 'bg-red-500' : 'bg-white/20'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Reset Leaderboard */}
        <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl mt-4">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-red-400 font-medium">Reset Game Leaderboard</h3>
              <p className="text-sm text-red-400/70">Permanently deletes all game sessions</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              if (confirm("Are you sure you want to permanently delete all game sessions?")) {
                setUpdating("maintenanceMode"); // reuse state just for loading UI
                try {
                  const res = await fetch("/api/admin/leaderboard", { method: "DELETE" });
                  if (res.ok) toast.success("Leaderboard reset successfully");
                  else toast.error("Failed to reset leaderboard");
                } catch {
                  toast.error("Network error");
                } finally {
                  setUpdating(null);
                }
              }
            }}
            disabled={updating !== null}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl transition-colors text-sm"
          >
            Reset Data
          </button>
        </div>
      </div>
    </div>
  );
}
