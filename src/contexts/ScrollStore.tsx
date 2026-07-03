"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   SCROLL STORE (SCROLL-SPY ENGINE)
   A lightweight context to sync the intersection observer state
   from the /details page to the global SideMenu highlighting.
   ═══════════════════════════════════════════════════════════════ */

interface ScrollContextProps {
  activeSection: string;
  setActiveSection: (sectionId: string) => void;
}

const ScrollContext = createContext<ScrollContextProps | undefined>(undefined);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState("");

  return (
    <ScrollContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollStore() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScrollStore must be used within a ScrollProvider");
  }
  return context;
}
