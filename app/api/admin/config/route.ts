import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSiteConfig, setSiteConfig, type SiteConfigKeys } from "@/lib/config";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await getSiteConfig();
  return NextResponse.json(config);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { key, value } = await req.json();
    const validKeys: SiteConfigKeys[] = ["gameEnabled", "gambleEnabled", "maintenanceMode"];

    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: "Invalid config key" }, { status: 400 });
    }

    if (value !== "true" && value !== "false") {
      return NextResponse.json({ error: "Value must be 'true' or 'false'" }, { status: 400 });
    }

    await setSiteConfig(key, value);
    return NextResponse.json({ success: true, key, value });
  } catch {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
