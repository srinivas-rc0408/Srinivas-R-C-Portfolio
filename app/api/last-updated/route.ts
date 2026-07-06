export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════
   GET /api/last-updated
   Max updatedAt across Document, Project, PortfolioData, Certificate.
   Cheap (4 indexed LIMIT-1 queries in parallel) and cached for an hour.
   ═══════════════════════════════════════════════════════════════ */


export async function getLastUpdated(): Promise<Date> {
  const [doc, project, portfolioData, certificate] = await Promise.all([
    prisma.document.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.project.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.portfolioData.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    // Certificate has no updatedAt column — createdAt is the closest signal.
    prisma.certificate.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  const dates = [doc?.updatedAt, project?.updatedAt, portfolioData?.updatedAt, certificate?.createdAt].filter(
    (d): d is Date => d instanceof Date
  );

  return dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();
}

export async function GET() {
  const updatedAt = await getLastUpdated();
  return NextResponse.json({ updatedAt: updatedAt.toISOString() });
}
