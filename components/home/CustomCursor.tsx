"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, select, textarea, label")) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);

    let rafId: number;
    const animate = () => {
      // Smooth lerp follow
      pos.current.x += (mouse.current.x - pos.current.x) * 0.15;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x - 3}px, ${mouse.current.y - 3}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x - 18}px, ${pos.current.y - 18}px)`;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Inner dot — glowing accent */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[10000] pointer-events-none"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#6C63FF",
          boxShadow: "0 0 8px rgba(108,99,255,0.8), 0 0 20px rgba(108,99,255,0.3)",
          willChange: "transform",
          transition: "width 0.2s, height 0.2s",
        }}
      />
      {/* Outer ring — expands on hover */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: hovering ? 48 : 36,
          height: hovering ? 48 : 36,
          borderRadius: "50%",
          border: `1.5px solid rgba(108, 99, 255, ${hovering ? 0.5 : 0.2})`,
          background: hovering ? "rgba(108, 99, 255, 0.06)" : "transparent",
          willChange: "transform",
          transition: "width 0.25s ease, height 0.25s ease, border-color 0.25s ease, background 0.25s ease",
          marginLeft: hovering ? -6 : 0,
          marginTop: hovering ? -6 : 0,
        }}
      />
    </>
  );
}
