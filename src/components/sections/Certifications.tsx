"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Award, Eye } from "lucide-react";
import CertificateModal from "@/src/components/modals/CertificateModal";

/* ═══════════════════════════════════════════════════════════════
   CERTIFICATIONS MATRIX
   Fetches public certificates from the DB. Most recent is larger.
   ═══════════════════════════════════════════════════════════════ */

interface Certificate {
  id: string;
  name: string;
  imageUrl: string;
  completedYear: number;
}

import { fetcher } from "@/lib/fetcher";

export default function Certifications() {
  const { data } = useSWR<Certificate[]>("/api/certificates", fetcher);
  const certs = data ?? [];
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  return (
    <section id="certifications" className="relative z-20 flex w-full flex-col items-center justify-center py-24 px-6 md:px-12">
      <div className="w-full max-w-5xl flex flex-col gap-12">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center gap-6"
        >
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white md:text-6xl flex items-center gap-4">
            <Award className="text-red-500" size={40} />
            Certifications
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-red-500/50 to-transparent" />
        </motion.div>

        {/* ── MATRIX GRID ── */}
        {certs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certs.map((cert, index) => {
              const isPrimary = index === 0;

              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] cursor-pointer transition-all hover:border-red-500/30 hover:shadow-[0_15px_40px_-10px_rgba(220,38,38,0.2)] ${
                    isPrimary ? "md:col-span-2 lg:col-span-2 aspect-[21/9]" : "col-span-1 aspect-[4/3]"
                  }`}
                  onClick={() => setSelectedCert(cert)}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                    style={{ backgroundImage: `url(${cert.imageUrl})` }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    <div className="flex flex-col gap-1 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                      <span className="text-xs font-bold uppercase tracking-widest text-red-500">
                        Completed {cert.completedYear}
                      </span>
                      <h3 className={`font-bold text-white leading-tight ${isPrimary ? "text-2xl" : "text-lg"}`}>
                        {cert.name}
                      </h3>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/20 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 rounded-full bg-red-600/90 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-xl backdrop-blur-md transform scale-90 transition-transform duration-300 group-hover:scale-100">
                      <Eye size={14} /> Tap to View
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── TERMINATION STATE ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 flex w-full items-center justify-center py-6 border-t border-white/5"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-4">
            <div className="h-[1px] w-8 bg-zinc-800" />
            more certifications yet to come
            <div className="h-[1px] w-8 bg-zinc-800" />
          </span>
        </motion.div>

      </div>

      <CertificateModal isOpen={!!selectedCert} onClose={() => setSelectedCert(null)} certificate={selectedCert} />
    </section>
  );
}
