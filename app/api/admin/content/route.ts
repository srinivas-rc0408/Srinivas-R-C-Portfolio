import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const CONTENT_DIR = join(process.cwd(), "lib", "content");
const ALLOWED_SECTIONS = [
  "resume", "projects", "cv", "skills", "experience",
  "education", "certifications", "open-source", "contact"
];

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section");

  if (!section || !ALLOWED_SECTIONS.includes(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  try {
    const filePath = join(CONTENT_DIR, `${section}.json`);
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ section, content });
  } catch {
    return NextResponse.json({ error: "Section file not found" }, { status: 404 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { section, content } = await req.json();

    if (!section || !ALLOWED_SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    // Validate JSON
    JSON.parse(content);

    const filePath = join(CONTENT_DIR, `${section}.json`);
    await writeFile(filePath, content, "utf-8");

    return NextResponse.json({ success: true, message: `${section}.json updated` });
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON syntax" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}
