"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   ADMIN STORE (MASTER SYNC ENGINE)
   Tracks all pending modifications in memory to minimize database
   writes and emulate enterprise-scale staging environments.
   ═══════════════════════════════════════════════════════════════ */

export interface PendingChange {
  id: string; // Unique ID for the change (e.g. "proj-1-title")
  section: string; // e.g. "Projects", "Education"
  field: string; // e.g. "Short Info"
  status: "Modified" | "Added" | "Deleted";
  payload: any; // The actual data to be saved
}

interface AdminContextProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingChanges: PendingChange[];
  addChange: (change: PendingChange) => void;
  removeChange: (id: string) => void;
  clearChanges: () => void;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("Projects");
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);

  const addChange = (change: PendingChange) => {
    setPendingChanges((prev) => {
      // Replace if exists, otherwise append
      const existingIndex = prev.findIndex((c) => c.id === change.id);
      if (existingIndex >= 0) {
        const newArr = [...prev];
        newArr[existingIndex] = change;
        return newArr;
      }
      return [...prev, change];
    });
  };

  const removeChange = (id: string) => {
    setPendingChanges((prev) => prev.filter((c) => c.id !== id));
  };

  const clearChanges = () => {
    setPendingChanges([]);
  };

  return (
    <AdminContext.Provider
      value={{
        activeTab,
        setActiveTab,
        pendingChanges,
        addChange,
        removeChange,
        clearChanges,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminStore() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminStore must be used within an AdminProvider");
  }
  return context;
}
