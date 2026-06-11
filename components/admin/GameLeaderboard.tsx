"use client";

import { GameSession, User } from "@prisma/client";
import { Trophy, Medal } from "lucide-react";

interface GameSessionWithUser extends GameSession {
  user: User | null;
}

interface GameLeaderboardProps {
  sessions: GameSessionWithUser[];
}

export default function GameLeaderboard({ sessions }: GameLeaderboardProps) {
  // Sort sessions by distanceTraveled (descending)
  const sortedSessions = [...sessions].sort((a, b) => b.distanceTraveled - a.distanceTraveled).slice(0, 10);

  return (
    <div className="bg-surface border border-white/5 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-space text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-500" size={24} />
            Game Leaderboard
          </h3>
          <p className="text-text-muted text-sm mt-1">Top players by distance traveled.</p>
        </div>
      </div>
      <div className="p-4">
        {sortedSessions.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No game sessions recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSessions.map((session, index) => (
              <div 
                key={session.id} 
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  index === 0 ? "bg-yellow-500/10 border-yellow-500/30" :
                  index === 1 ? "bg-gray-400/10 border-gray-400/30" :
                  index === 2 ? "bg-amber-700/10 border-amber-700/30" :
                  "bg-white/5 border-transparent hover:border-white/10"
                } transition-colors`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? "bg-yellow-500 text-black" :
                    index === 1 ? "bg-gray-300 text-black" :
                    index === 2 ? "bg-amber-600 text-white" :
                    "bg-white/10 text-text-muted"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white flex items-center gap-2">
                      {session.user?.name || "Guest"}
                      {index < 3 && <Medal size={16} className={
                        index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-gray-400" :
                        "text-amber-600"
                      } />}
                    </div>
                    <div className="text-xs text-text-muted">
                      Vehicle: <span className="capitalize text-white/70">{session.vehicleType}</span> • 
                      Stops: <span className="text-white/70">{session.stopsVisited.length}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-space font-bold text-lg text-white">
                    {Math.round(session.distanceTraveled).toLocaleString()} <span className="text-sm text-text-muted font-normal">px</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    {new Date(session.playedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
