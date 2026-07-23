"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";

/* ═══════════════════════════════════════════════════════════════
   GAME LEADERBOARD — shared by Spidey Dash (death screen) and
   Web Drive (trip summary). Submits this run's score once on
   mount (signed-in name, guest name, or "Web-Slinger"), then
   shows the global top 10 with the player's row highlighted.
   ═══════════════════════════════════════════════════════════════ */

interface LeaderboardProps {
  game: "dash" | "drive" | "rush";
  score: number;
  unit?: string;
}

type Row = { name: string; score: number };

export default function Leaderboard({ game, score, unit = "m" }: LeaderboardProps) {
  const { displayName } = useAuth();
  const name = (displayName ?? "Web-Slinger").slice(0, 24);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (score > 0) {
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game, name, score }),
        }).catch(() => {});
      }
      try {
        const res = await fetch(`/api/leaderboard?game=${game}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.scores)) setRows(data.scores);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // one submit + fetch per mount — the overlay mounts once per run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-xs rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-center gap-2">
        <Trophy size={13} className="text-red-400" />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
          Top Web-Slingers
        </span>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-3">
          <Loader2 size={16} className="animate-spin text-zinc-600" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-2 text-center text-xs text-zinc-600">No scores yet — set the first one.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {rows.map((row, i) => {
            const isMe = row.name === name;
            return (
              <li
                key={`${row.name}-${i}`}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                  isMe ? "bg-red-500/15 font-bold text-white" : "text-zinc-400"
                }`}
              >
                <span className={`w-5 text-right font-mono ${i < 3 ? "text-red-400" : "text-zinc-600"}`}>
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-left">{row.name}</span>
                <span className="font-mono">
                  {row.score.toLocaleString()}
                  {unit}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
