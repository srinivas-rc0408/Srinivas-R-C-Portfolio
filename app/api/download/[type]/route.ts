import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSessionCookie, verifyToken } from "@/lib/auth";
import { checkDownloadRateLimit } from "@/lib/rateLimit";
import { watermarkPdf } from "@/lib/watermark";
import { estimateCompany, summarizeUserAgent } from "@/lib/recruiterIntel";

/* ═══════════════════════════════════════════════════════════════
   GET /api/download/[type]
   type: "resume" | "cv" | "report:<projectSlug>"
   Registered visitors only. Watermarks + logs every download.
   ═══════════════════════════════════════════════════════════════ */

export const maxDuration = 30;

interface DownloadSource {
  fileUrl: string;
  sectionName: string;
  fileName: string;
}

export async function resolveSource(type: string): Promise<DownloadSource | null> {
  if (type === "resume" || type === "cv") {
    const doc = await prisma.document.findUnique({ where: { type } });
    if (!doc?.fileUrl) return null;
    return { fileUrl: doc.fileUrl, sectionName: type === "resume" ? "Resume" : "CV", fileName: `SrinivasRC_${type}.pdf` };
  }

  if (type.startsWith("report:")) {
    const slug = type.slice("report:".length);
    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project?.reportUrl) return null;
    return {
      fileUrl: project.reportUrl,
      sectionName: `${project.title} Report`,
      fileName: `SrinivasRC_${slug}_report.pdf`,
    };
  }

  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const token = await getUserSessionCookie();
  const payload = token ? await verifyToken(token) : null;

  if (!payload || payload.role !== "user" || !payload.sub) {
    return NextResponse.json({ reason: "register" }, { status: 401 });
  }

  const allowed = await checkDownloadRateLimit(payload.sub);
  if (!allowed) {
    return NextResponse.json({ error: "Download limit reached. Try again in an hour." }, { status: 429 });
  }

  const { type } = await params;
  const source = await resolveSource(type);
  if (!source) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const sourceRes = await fetch(source.fileUrl);
    if (!sourceRes.ok) throw new Error(`Failed to fetch source file (${sourceRes.status}).`);
    const sourceBytes = await sourceRes.arrayBuffer();

    const watermarked = await watermarkPdf(sourceBytes, {
      sectionName: source.sectionName,
      name: payload.name || "Registered User",
      email: payload.email,
    });

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const estimatedCompany = await estimateCompany(ip);

    await prisma.downloadLog.create({
      data: {
        userId: payload.sub,
        section: type,
        fileName: source.fileName,
        ipAddress: ip,
        userAgent: summarizeUserAgent(userAgent),
        estimatedCompany,
      },
    });

    return new NextResponse(Buffer.from(watermarked), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${source.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return NextResponse.json({ error: "Failed to generate download." }, { status: 500 });
  }
}
