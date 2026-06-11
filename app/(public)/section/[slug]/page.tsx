"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import DownloadButton from "@/components/sections/DownloadButton";

// Dynamic import for ThreeBackground to ensure no SSR
const ThreeBackground = dynamic(() => import("@/components/backgrounds/ThreeBackground"), { ssr: false });

const sectionColors: Record<string, string> = {
  "resume": "#8b5cf6",
  "projects": "#3b82f6",
  "cv": "#14b8a6",
  "skills": "#22c55e",
  "experience": "#f59e0b",
  "education": "#ec4899",
  "certifications": "#f97316",
  "open-source": "#9ca3af",
  "contact": "#f87171"
};

export default function SectionPage({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Analytics
    fetch("/api/analytics", {
      method: "POST",
      body: JSON.stringify({ event: "section_view", section: params.slug })
    }).catch(() => {});

    // Fetch JSON Content dynamically
    const loadContent = async () => {
      try {
        const content = await import(`@/lib/content/${params.slug}.json`);
        setData(content.default || content);
      } catch (err) {
        // Silent fail — section content not found
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [params.slug]);

  const colorHex = sectionColors[params.slug] || "#6C63FF";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-3xl font-space font-bold mb-4">Section Not Found</h1>
        <Link href="/sections" className="text-accent hover:underline">Return to Browser</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ThreeBackground colorHex={colorHex} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16">
          <div>
            <Link href="/sections" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
              <ArrowLeft size={20} /> Back to Sections
            </Link>
            <h1 className="font-space text-4xl md:text-6xl font-bold text-white mb-4">
              {data.title}
            </h1>
            <p className="text-xl text-text-muted font-mono border-l-2 pl-4" style={{ borderColor: colorHex }}>
              {data.tagline}
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <DownloadButton sectionSlug={params.slug} sectionName={data.title} />
          </div>
        </div>

        <div className="space-y-12">
          {data.sections?.map((sec: any, idx: number) => (
            <div key={idx} className="bg-surface/40 backdrop-blur border border-white/5 rounded-2xl p-6 sm:p-8">
              <h2 className="font-space text-2xl font-bold mb-6" style={{ color: colorHex }}>
                {sec.heading}
              </h2>
              <ul className="space-y-4">
                {sec.items.map((item: string, i: number) => (
                  <li key={i} className="text-text-main text-lg flex items-start">
                    <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colorHex }} />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
