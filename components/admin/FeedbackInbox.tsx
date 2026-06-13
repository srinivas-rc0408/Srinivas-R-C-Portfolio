"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, AlertTriangle, Loader2, MessageSquare, Inbox } from "lucide-react";
import { toast } from "sonner";

interface FeedbackItem {
  id: string;
  email: string;
  message: string;
  isRead: boolean;
  isFlagged: boolean;
  guestId: string | null;
  createdAt: string;
}

export default function FeedbackInbox() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/admin/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      }
    } catch {
      toast.error("Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = async (id: string, currentState: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: !currentState }),
      });
      if (res.ok) {
        setFeedback((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isRead: !currentState } : f))
        );
        toast.success(currentState ? "Marked as unread" : "Marked as read");
      }
    } catch {
      toast.error("Failed to update.");
    } finally {
      setTogglingId(null);
    }
  };

  const unreadCount = feedback.filter((f) => !f.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
          <Inbox size={28} className="text-white/20" />
        </div>
        <p className="text-white/40 font-space">No feedback received yet.</p>
        <p className="text-white/20 text-sm mt-1">Feedback will appear here when users submit it.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header stats */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <MessageSquare size={16} className="text-accent" />
          <span className="text-sm font-space text-white/70">{feedback.length} total</span>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-space text-cyan-400">{unreadCount} unread</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.05]">
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.05]">
              <th className="px-5 py-3 text-left text-xs font-space font-semibold text-white/40 uppercase tracking-wider w-8"></th>
              <th className="px-5 py-3 text-left text-xs font-space font-semibold text-white/40 uppercase tracking-wider">Message</th>
              <th className="px-5 py-3 text-left text-xs font-space font-semibold text-white/40 uppercase tracking-wider w-32">From</th>
              <th className="px-5 py-3 text-left text-xs font-space font-semibold text-white/40 uppercase tracking-wider w-36">Date</th>
              <th className="px-5 py-3 text-center text-xs font-space font-semibold text-white/40 uppercase tracking-wider w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {feedback.map((item) => (
              <tr
                key={item.id}
                className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${
                  item.isFlagged ? "border-l-2 border-l-amber-500/40 bg-amber-500/[0.02]" : ""
                }`}
              >
                {/* Unread indicator */}
                <td className="px-5 py-4">
                  {!item.isRead ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  )}
                </td>

                {/* Message */}
                <td className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    {item.isFlagged && (
                      <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm leading-relaxed ${item.isRead ? "text-white/50" : "text-white/85"}`}>
                      {item.message}
                    </p>
                  </div>
                </td>

                {/* From / Email */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <a 
                      href={`mailto:${item.email}`}
                      className="text-sm font-medium text-accent hover:text-accent/80 transition-colors truncate max-w-[120px]"
                      title={item.email}
                    >
                      {item.email}
                    </a>
                    <span className="text-xs font-mono text-white/30 truncate max-w-[120px]" title={item.guestId || "Anonymous"}>
                      {item.guestId || "Anonymous"}
                    </span>
                  </div>
                </td>

                {/* Date */}
                <td className="px-5 py-4">
                  <span className="text-xs font-mono text-white/30">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </td>

                {/* Toggle read */}
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => toggleRead(item.id, item.isRead)}
                    disabled={togglingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-space transition-all hover:bg-white/[0.05] disabled:opacity-40"
                    title={item.isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {togglingId === item.id ? (
                      <Loader2 size={12} className="animate-spin text-white/40" />
                    ) : item.isRead ? (
                      <Circle size={12} className="text-white/30" />
                    ) : (
                      <CheckCircle size={12} className="text-cyan-400" />
                    )}
                    <span className="text-white/50">{item.isRead ? "Unread" : "Read"}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
