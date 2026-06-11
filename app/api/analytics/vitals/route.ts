import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, bypassed: true });
    }

    const body = await req.json();
    const { name, value, rating, delta, path } = body;

    // Fire and forget, don't block the client
    await prisma.performanceMetric.create({
      data: {
        name,
        value,
        rating,
        delta,
        path,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // Silently fail if DB is down or payload is malformed
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
