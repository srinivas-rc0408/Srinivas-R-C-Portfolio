"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "feedback_state";
const INITIAL_DELAY = 5 * 60 * 1000;   // 5 minutes
const SNOOZE_DELAY = 10 * 60 * 1000;   // 10 minutes

interface FeedbackState {
  completed: boolean;
  triggerAt: number; // timestamp
}

function getState(): FeedbackState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: false, triggerAt: Date.now() + INITIAL_DELAY };
}

function setState(state: FeedbackState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useFeedbackTimer() {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const state = getState();

    // Already submitted — never show again
    if (state.completed) return;

    // First visit: initialize trigger time
    if (!localStorage.getItem(STORAGE_KEY)) {
      setState({ completed: false, triggerAt: Date.now() + INITIAL_DELAY });
    }

    const check = () => {
      const s = getState();
      if (s.completed) return;
      if (Date.now() >= s.triggerAt) {
        setShowFeedback(true);
      }
    };

    // Check immediately and then every 10s
    check();
    const interval = setInterval(check, 10_000);
    return () => clearInterval(interval);
  }, []);

  const snooze = useCallback(() => {
    setShowFeedback(false);
    setState({ completed: false, triggerAt: Date.now() + SNOOZE_DELAY });
  }, []);

  const complete = useCallback(() => {
    setShowFeedback(false);
    setState({ completed: true, triggerAt: 0 });
  }, []);

  return { showFeedback, snooze, complete };
}
