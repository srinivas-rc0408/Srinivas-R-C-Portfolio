"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, FileText, Code2, Scroll, Cpu, Briefcase, GraduationCap, Award, Github, Mail } from "lucide-react";
import { toast } from "sonner";

const sections = [
  { id: "resume", name: "Resume", icon: FileText, color: "text-violet-500" },
  { id: "projects", name: "Projects", icon: Code2, color: "text-blue-500" },
  { id: "cv", name: "CV", icon: Scroll, color: "text-teal-500" },
  { id: "skills", name: "Skills", icon: Cpu, color: "text-green-500" },
  { id: "experience", name: "Experience", icon: Briefcase, color: "text-amber-500" },
  { id: "education", name: "Education", icon: GraduationCap, color: "text-pink-500" },
  { id: "certifications", name: "Certifications", icon: Award, color: "text-orange-500" },
  { id: "open-source", name: "Open Source", icon: Github, color: "text-gray-400" },
  { id: "contact", name: "Contact", icon: Mail, color: "text-red-400" },
];

// Create a long array for the reel to spin through
const reelItems = Array.from({ length: 50 }, (_, i) => sections[i % sections.length]);

// easeOutExpo deceleration curve: t = 1 - Math.pow(2, -10 * t)
function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export default function GambleModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [winnerIndex, setWinnerIndex] = useState<number>(-1);
  const reelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const CARD_WIDTH = 200; // includes gap

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("openGambleModal", handleOpen);
    return () => window.removeEventListener("openGambleModal", handleOpen);
  }, []);

  const spin = () => {
    if (phase !== 0 && phase !== 4) return;
    
    // Choose a random winner in the middle-end of the reel (between index 30 and 45)
    const targetWinnerReelIndex = Math.floor(Math.random() * 15) + 30;
    setWinnerIndex(targetWinnerReelIndex);
    
    toast("Spinning the wheel...", { duration: 6000, icon: "🎲" });

    setPhase(1);
    
    // Calculate total pixels to scroll so that the winner is centered
    // We assume the container is roughly centered
    const viewportCenter = window.innerWidth / 2;
    const offset = targetWinnerReelIndex * CARD_WIDTH - viewportCenter + (CARD_WIDTH / 2);
    
    let startTime: number | null = null;
    const totalDuration = 6000; // 6 seconds total spin

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      if (elapsed < totalDuration) {
        // Normalize time [0, 1]
        const t = elapsed / totalDuration;
        
        // Phase 1 (0-3s): linear fast
        // Phase 2 (3-6s): easeOutExpo
        const progress = easeOutExpo(t);
        
        const currentScroll = progress * offset;
        
        if (reelRef.current) {
          reelRef.current.style.transform = `translateX(-${currentScroll}px)`;
          // Add motion blur based on speed
          const speed = (1 - progress) * 20; 
          reelRef.current.style.filter = `blur(${speed}px)`;
        }
        
        requestAnimationFrame(animate);
      } else {
        // Snap exactly
        if (reelRef.current) {
          reelRef.current.style.transform = `translateX(-${offset}px)`;
          reelRef.current.style.filter = 'blur(0px)';
        }
        setPhase(3);
        setTimeout(() => {
          setPhase(4);
          toast.success(`Landed on ${reelItems[targetWinnerReelIndex].name}!`);
        }, 1000);
      }
    };
    
    requestAnimationFrame(animate);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-[12px]"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          setPhase(0);
        }
      }}
      ref={(el) => { if (el) el.focus() }}
    >
      <button 
        onClick={() => { setIsOpen(false); setPhase(0); }} 
        className="absolute top-6 right-6 text-text-muted hover:text-white"
      >
        <X size={32} />
      </button>

      <div className="w-full relative py-20 flex flex-col items-center">
        {/* Selector Line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-secondary z-20 shadow-[0_0_10px_rgba(255,101,132,1)]" />
        
        {/* Reel Container */}
        <div 
          className="w-full overflow-hidden"
          style={{ contain: "strict", height: "240px" }}
        >
          <div 
            ref={reelRef}
            className="flex h-full items-center transition-none"
            style={{ width: `${reelItems.length * CARD_WIDTH}px` }}
          >
            {reelItems.map((item, i) => {
              const Icon = item.icon;
              const isWinner = phase >= 3 && i === winnerIndex;
              return (
                <div 
                  key={i} 
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: `${CARD_WIDTH}px` }}
                >
                  <div className={`w-40 h-48 bg-surface border-2 rounded-xl flex flex-col items-center justify-center p-4 transition-all duration-300
                    ${isWinner ? 'border-secondary scale-110 shadow-[0_0_30px_rgba(255,101,132,0.8)] z-10 bg-surface' : 'border-white/10 opacity-70 scale-90'}`}
                  >
                    <Icon size={48} className={`mb-4 ${item.color}`} />
                    <span className="font-space font-bold text-lg text-center leading-tight">
                      {item.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center min-h-[100px]">
          {(phase === 0 || phase === 4) && (
            <button 
              onClick={spin}
              className="px-8 py-3 rounded-full bg-secondary text-white font-bold tracking-wider text-xl hover:shadow-[0_0_20px_rgba(255,101,132,0.8)] transition-all uppercase"
            >
              {phase === 0 ? "OPEN CASE" : "TRY AGAIN"}
            </button>
          )}

          {phase === 4 && (
            <button 
              onClick={() => {
                setIsOpen(false);
                router.push(`/section/${reelItems[winnerIndex].id}`);
              }}
              className="mt-6 px-10 py-4 rounded-full bg-accent text-white font-bold tracking-wider text-2xl hover:shadow-[0_0_30px_rgba(108,99,255,0.8)] transition-all uppercase animate-pulse"
            >
              VIEW SECTION
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
