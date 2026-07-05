"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Markdown from "react-markdown";

/* ═══════════════════════════════════════════════════════════════
   PROJECT DETAIL (/projects/[slug])
   Two-tier info, tier two: full long-form markdown write-up.
   ═══════════════════════════════════════════════════════════════ */

interface ProjectDetail {
  title: string;
  longInfo: string;
  githubUrl: string;
  tags: string[];
}

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: project, error } = useSWR<ProjectDetail>(slug ? `/api/projects/${slug}` : null, fetcher);

  useEffect(() => {
    if (!slug) return;
    // Fire-and-forget — never blocks render, errors are ignored.
    fetch("/api/log/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: `projects:${slug}` }),
    }).catch(() => {});
  }, [slug]);

  return (
    <main className="min-h-screen w-full bg-[#050508] pb-32">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-[#050508] to-[#050508]" />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pt-16 md:px-12">
        <Link href="/projects">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} /> Back
          </motion.button>
        </Link>

        {error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-zinc-500">Project not found.</p>
          </div>
        ) : !project ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-zinc-600" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b border-white/5 pb-8">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
                {project.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="w-fit">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:text-white"
                >
                  <ExternalLink size={14} /> View on GitHub
                </motion.button>
              </a>
            </div>

            <div className="flex flex-col gap-4 text-base leading-relaxed text-zinc-300">
              <Markdown
                components={{
                  h1: (props) => <h2 className="mt-4 text-2xl font-bold text-white" {...props} />,
                  h2: (props) => <h3 className="mt-4 text-xl font-bold text-white" {...props} />,
                  h3: (props) => <h4 className="mt-3 text-lg font-bold text-white" {...props} />,
                  p: (props) => <p className="leading-relaxed text-zinc-300" {...props} />,
                  a: (props) => (
                    <a className="text-red-400 underline hover:text-red-300" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  ul: (props) => <ul className="list-inside list-disc space-y-1 text-zinc-300" {...props} />,
                  ol: (props) => <ol className="list-inside list-decimal space-y-1 text-zinc-300" {...props} />,
                  li: (props) => <li className="text-zinc-300" {...props} />,
                  strong: (props) => <strong className="font-semibold text-white" {...props} />,
                  code: (props) => <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-red-300" {...props} />,
                }}
              >
                {project.longInfo}
              </Markdown>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
