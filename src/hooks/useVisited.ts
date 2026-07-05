"use client";

import { useCallback, useEffect, useState } from "react";

const VISITED_KEY = "visited:v1";

export function useVisited() {
  const [visited, setVisited] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      // Deferred to after mount so SSR and the first client render match (no localStorage on the server).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisited(JSON.parse(localStorage.getItem(VISITED_KEY) || "{}"));
    } catch {
      // malformed storage — start fresh
    }
  }, []);

  const markVisited = useCallback((id: string) => {
    setVisited((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: true };
      localStorage.setItem(VISITED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { visited, markVisited };
}
