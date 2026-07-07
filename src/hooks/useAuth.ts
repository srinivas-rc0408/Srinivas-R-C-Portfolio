"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

/* ═══════════════════════════════════════════════════════════════
   useAuth — visitor auth state.
   Registered status comes from /api/auth/user/me (cookie-backed).
   Guest status is resolved purely on the client from localStorage —
   it never touches the API.
   ═══════════════════════════════════════════════════════════════ */

const GUEST_NAME_KEY = "srinivas_guest_name";

interface MeResponse {
  status: "guest" | "user";
  name?: string;
  email?: string;
}

import { fetcher } from "@/lib/fetcher";

export function useAuth() {
  const { data, isLoading, mutate } = useSWR<MeResponse>("/api/auth/user/me", fetcher);
  const [guestName, setGuestNameState] = useState<string | null>(null);

  useEffect(() => {
    // Deferred to after mount so SSR and the first client render match (no localStorage on the server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuestNameState(localStorage.getItem(GUEST_NAME_KEY));
  }, []);

  const setGuestName = useCallback((name: string) => {
    localStorage.setItem(GUEST_NAME_KEY, name);
    setGuestNameState(name);
  }, []);

  const clearGuestName = useCallback(() => {
    localStorage.removeItem(GUEST_NAME_KEY);
    setGuestNameState(null);
  }, []);

  const isRegistered = data?.status === "user";
  const isGuest = !isRegistered && !!guestName;

  return {
    isLoading,
    isRegistered,
    isGuest,
    displayName: isRegistered ? data?.name ?? null : guestName,
    email: isRegistered ? data?.email : undefined,
    refresh: mutate,
    setGuestName,
    clearGuestName,
  };
}
