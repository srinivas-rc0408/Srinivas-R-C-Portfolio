"use client";

import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function ParticleBackground() {
  // Initialize the engine via callback, completely avoiding the v3 Webpack bug
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      className="fixed inset-0 -z-10"
      init={particlesInit}
      options={{
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
          },
        },
        particles: {
          color: { value: ["#6C63FF", "#FF6584"] },
          links: { 
            enable: true, 
            color: "#8888BB", 
            distance: 150, 
            opacity: 0.2, 
            width: 1 
          },
          move: { 
            enable: true, 
            speed: 1, 
            direction: "none", 
            outModes: { default: "bounce" } 
          },
          number: { 
            density: { enable: true, area: 800 }, 
            value: 120 
          },
          opacity: { value: 0.3 },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 3 } },
        },
        detectRetina: true,
      }}
    />
  );
}
