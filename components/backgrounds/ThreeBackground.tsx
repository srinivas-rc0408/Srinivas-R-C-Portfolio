"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ThreeBackgroundProps {
  colorHex: string; // e.g. "#6C63FF"
}

export default function ThreeBackground({ colorHex }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile Check
    if (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) {
      setIsMobile(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Geometry & Material
    const geometry = new THREE.IcosahedronGeometry(10, 1);
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 30;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      mesh.rotation.x += 0.001;
      mesh.rotation.y += 0.002;
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // CRITICAL: Cleanup to prevent memory leaks
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [colorHex]);

  if (isMobile) {
    // Fallback static gradient for mobile
    return (
      <div 
        className="fixed inset-0 -z-10 opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${colorHex}40 0%, transparent 70%)`
        }}
      />
    );
  }

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none" />;
}
