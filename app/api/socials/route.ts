import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

/* ═══════════════════════════════════════════════════════════════
   API: /api/socials
   Handles the Master Socials & Footer Engine backend.
   Persists global footer links to the SQLite 'portfolio_data' table.
   ═══════════════════════════════════════════════════════════════ */

async function openDb() {
  return open({
    filename: "./data.db",
    driver: sqlite3.Database,
  });
}

// Default fallback socials
const DEFAULT_SOCIALS = {
  Instagram: "https://instagram.com",
  Email: "hello@example.com",
  LinkedIn: "https://linkedin.com",
  GitHub: "https://github.com",
  Steam: "https://steamcommunity.com",
};

// GET: Fetch the latest social links
export async function GET() {
  try {
    const db = await openDb();
    
    // Ensure table exists (fallback)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_data (
        id SERIAL PRIMARY KEY,
        section_key VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(500),
        description TEXT,
        metadata JSONB DEFAULT '{}',
        sort_order INTEGER DEFAULT 0,
        is_visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const row = await db.get("SELECT metadata FROM portfolio_data WHERE section_key = 'socials'");
    
    if (!row) {
      // Seed if missing
      await db.run(
        "INSERT INTO portfolio_data (section_key, title, metadata) VALUES (?, ?, ?)",
        ["socials", "Social Links", JSON.stringify(DEFAULT_SOCIALS)]
      );
      return NextResponse.json(DEFAULT_SOCIALS);
    }

    const socials = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
    return NextResponse.json({ ...DEFAULT_SOCIALS, ...socials });
  } catch (error) {
    console.error("GET Socials Error:", error);
    return NextResponse.json({ error: "Failed to load socials" }, { status: 500 });
  }
}

// POST: Update the social links
export async function POST(request: Request) {
  try {
    const { socials } = await request.json();
    if (!socials || typeof socials !== "object") {
      return NextResponse.json({ error: "Invalid data format. Expected an object." }, { status: 400 });
    }

    const db = await openDb();
    
    const row = await db.get("SELECT id FROM portfolio_data WHERE section_key = 'socials'");
    
    if (row) {
      await db.run(
        "UPDATE portfolio_data SET metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE section_key = 'socials'",
        [JSON.stringify(socials)]
      );
    } else {
      await db.run(
        "INSERT INTO portfolio_data (section_key, title, metadata) VALUES (?, ?, ?)",
        ["socials", "Social Links", JSON.stringify(socials)]
      );
    }

    return NextResponse.json({ success: true, message: "Socials updated successfully." });
  } catch (error) {
    console.error("POST Socials Error:", error);
    return NextResponse.json({ error: "Failed to sync socials" }, { status: 500 });
  }
}
