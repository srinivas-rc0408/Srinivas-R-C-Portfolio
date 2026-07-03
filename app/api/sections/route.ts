import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

/* ═══════════════════════════════════════════════════════════════
   API: /api/sections
   Handles the Universal Section Manager backend.
   Persists dynamic sections to the SQLite 'dynamic_sections' table.
   ═══════════════════════════════════════════════════════════════ */

async function openDb() {
  return open({
    filename: "./data.db",
    driver: sqlite3.Database,
  });
}

// GET all sections
export async function GET() {
  try {
    const db = await openDb();
    // Ensure table exists (fallback)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS dynamic_sections (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        items JSONB DEFAULT '[]',
        sort_order INTEGER DEFAULT 0
      );
    `);

    const rows = await db.all("SELECT * FROM dynamic_sections ORDER BY sort_order ASC");
    
    // Parse JSON items
    const sections = rows.map((row) => ({
      id: row.id,
      title: row.title,
      items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
    }));

    return NextResponse.json(sections);
  } catch (error) {
    console.error("GET Sections Error:", error);
    return NextResponse.json({ error: "Failed to load sections" }, { status: 500 });
  }
}

// POST: Sync the entire sections array (overwrites existing, adds new, deletes removed)
export async function POST(request: Request) {
  try {
    const { sections } = await request.json();
    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: "Invalid data format. Expected array of sections." }, { status: 400 });
    }

    const db = await openDb();
    
    // Begin transaction for safety
    await db.exec("BEGIN TRANSACTION");

    try {
      // Clear all existing
      await db.run("DELETE FROM dynamic_sections");

      // Insert new array in order
      const stmt = await db.prepare(
        "INSERT INTO dynamic_sections (id, title, items, sort_order) VALUES (?, ?, ?, ?)"
      );

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        await stmt.run(
          sec.id,
          sec.title,
          JSON.stringify(sec.items || []),
          i // sort_order
        );
      }
      await stmt.finalize();

      await db.exec("COMMIT");
      return NextResponse.json({ success: true, message: "Sections synced successfully." });
    } catch (txError) {
      await db.exec("ROLLBACK");
      throw txError;
    }
  } catch (error) {
    console.error("POST Sections Error:", error);
    return NextResponse.json({ error: "Failed to sync sections" }, { status: 500 });
  }
}
