"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { Mail, Clock, Flag, CheckCircle2, Circle } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   FEEDBACK INBOX
   Newest-first list with mark-read / flag toggles.
   ═══════════════════════════════════════════════════════════════ */

interface FeedbackRow {
  id: string;
  email: string;
  message: string;
  isRead: boolean;
  isFlagged: boolean;
  createdAt: string;
}

import { fetcher } from "@/lib/fetcher";

export default function FeedbackInbox() {
  const { data, mutate } = useSWR<FeedbackRow[]>("/api/feedback", fetcher);
  const feedback = data ?? [];

  const toggle = async (id: string, field: "isRead" | "isFlagged", value: boolean) => {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    await mutate();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-white/5 pb-6">
        <h2 className="flex items-center gap-3 text-2xl font-bold tracking-wide text-white">
          <Mail size={22} className="text-red-500" /> Feedback Inbox
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Newest first. Mark read or flag for follow-up.</p>
      </div>

      <div className="flex flex-col gap-3">
        {feedback.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-600">No feedback yet.</p>
        ) : (
          feedback.map((item) => (
            <motion.div
              key={item.id}
              layout
              className={`rounded-2xl border p-5 transition-colors ${
                item.isRead ? "border-white/5 bg-zinc-900/20" : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white">{item.email}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <Clock size={11} /> {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggle(item.id, "isRead", !item.isRead)}
                    title={item.isRead ? "Mark unread" : "Mark read"}
                    className={`rounded-lg p-2 transition-colors ${
                      item.isRead ? "text-emerald-400 hover:bg-white/10" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.isRead ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggle(item.id, "isFlagged", !item.isFlagged)}
                    title={item.isFlagged ? "Unflag" : "Flag"}
                    className={`rounded-lg p-2 transition-colors ${
                      item.isFlagged ? "text-amber-400 hover:bg-white/10" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Flag size={16} fill={item.isFlagged ? "currentColor" : "none"} />
                  </motion.button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">{item.message}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
