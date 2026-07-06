"use client";

import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import Footer from "./Footer";
import { useScrollStore } from "@/src/contexts/ScrollStore";

/* ═══════════════════════════════════════════════════════════════
   MAIN LAYOUT SHELL (AAA LAYOUT)
   The central wrapper managing the Navbar, SideMenu, and Footer.
   It protects the Admin OS from rendering public components.
   ═══════════════════════════════════════════════════════════════ */

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isMenuOpen, openMenu, closeMenu } = useScrollStore();
  const pathname = usePathname();

  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [100, 500], [0, 1]);

  // The Admin_OS and the full-screen game are separate application shells.
  // We do not render the public Navbar, SideMenu, or Footer over them —
  // beyond visual clutter, the game's fixed z-100 overlay would otherwise
  // be trapped inside this file's <main z-10> stacking context and end up
  // painted BELOW the Navbar (z-80) and Footer (z-30), which live outside it.
  const isAdminRoute = pathname?.startsWith("/admin");
  const isGameRoute = pathname === "/game";

  if (isAdminRoute || isGameRoute) {
    return (
      <div className="min-h-screen w-full bg-[#050508] text-white overflow-x-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative text-white bg-transparent overflow-x-hidden">
      
      {/* ── Global Background Image (Fades in on scroll) ── */}
      <motion.div 
        style={{ opacity: backgroundOpacity, backgroundImage: "url('/spiderman/11.png')" }}
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat pointer-events-none" 
      />
      
      {/* ── Darkening Overlay ── */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#050508] via-black/40 to-black/80 pointer-events-none" />

      {/* ── Top Navigation ── */}
      <Navbar onMenuTrigger={openMenu} />

      {/* ── Slide-out Hamburger Menu ── */}
      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />

      {/* ── Main Content Area ── */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        {children}
      </main>

      {/* ── Global Footer ── */}
      <Footer />
      
    </div>
  );
}
