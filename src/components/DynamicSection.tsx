"use client";

import { motion } from "framer-motion";
import { Link as LinkIcon, ExternalLink } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DYNAMIC SECTION (PUBLIC UI)
   Renders a dynamically created section from the CMS onto the
   public portfolio. Highly polished with cinematic enter animations.
   ═══════════════════════════════════════════════════════════════ */

interface SectionItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  link: string;
}

interface Section {
  id: string;
  title: string;
  items: SectionItem[];
}

export default function DynamicSection({ data }: { data: Section }) {
  if (!data || !data.items || data.items.length === 0) return null;

  return (
    <section 
      id={data.id} 
      className="relative z-20 flex w-full flex-col items-center justify-center py-24 px-6 md:px-12"
    >
      <div className="w-full max-w-5xl flex flex-col gap-12">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center gap-6"
        >
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white md:text-6xl">
            {data.title}
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-red-500/50 to-transparent" />
        </motion.div>

        {/* Items Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-colors hover:bg-white/[0.04] hover:border-red-500/30"
            >
              {/* Subtle Red Glow on Hover */}
              <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                   style={{ background: 'radial-gradient(circle at 50% 0%, rgba(220,38,38,0.15) 0%, transparent 70%)' }} />

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-white tracking-wide">{item.title}</h3>
                  {item.subtitle && (
                    <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
                      {item.subtitle}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </div>

              {/* Link Footer */}
              {item.link && (
                <div className="relative z-10 mt-8 pt-4 border-t border-white/10">
                  <a
                    href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:text-white"
                  >
                    <LinkIcon size={12} className="text-red-500" />
                    View Details
                    <ExternalLink size={12} className="ml-1 opacity-50" />
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
