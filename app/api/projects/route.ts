import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   API: /api/projects
   Public: visible projects, card shape only.
   Admin (valid session cookie): all projects, full shape.
   PUT: admin-only bulk upsert from the pending-changes staging flow.
   ═══════════════════════════════════════════════════════════════ */

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === "admin";
}

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin(request);

    if (admin) {
      const projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
      return NextResponse.json(projects);
    }

    const projects = await prisma.project.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, title: true, shortInfo: true, githubUrl: true, tags: true },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

interface ProjectPayload {
  slug: string;
  title: string;
  shortInfo: string;
  longInfo: string;
  githubUrl: string;
  reportUrl: string | null;
  tags: string[];
  sortOrder: number;
  isVisible: boolean;
}

function isValidProject(p: unknown): p is ProjectPayload {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.slug === "string" &&
    typeof o.title === "string" &&
    typeof o.shortInfo === "string" &&
    typeof o.longInfo === "string" &&
    typeof o.githubUrl === "string" &&
    (o.reportUrl === null || typeof o.reportUrl === "string") &&
    Array.isArray(o.tags) &&
    o.tags.every((t) => typeof t === "string") &&
    typeof o.sortOrder === "number" &&
    typeof o.isVisible === "boolean"
  );
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body) || !body.every(isValidProject)) {
      return NextResponse.json({ error: "Invalid payload. Expected an array of projects." }, { status: 400 });
    }

    const projects = body as ProjectPayload[];
    await prisma.$transaction(
      projects.map((p) =>
        prisma.project.upsert({
          where: { slug: p.slug },
          update: p,
          create: p,
        })
      )
    );

    return NextResponse.json({ success: true, message: "Projects updated successfully." });
  } catch (error) {
    console.error("PUT Projects Error:", error);
    return NextResponse.json({ error: "Failed to update projects" }, { status: 500 });
  }
}
