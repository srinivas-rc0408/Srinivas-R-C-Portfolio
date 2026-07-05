export interface ParsedProject {
  title: string;
  shortInfo: string;
  githubUrl: string;
  reportUrl: string | null;
  tags: string[];
  longInfo: string;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Parses content/projects.md: "# Title" blocks with key: value metadata, then a markdown body. */
export function parseProjectsMd(raw: string): ParsedProject[] {
  const blocks = raw
    .split(/\n(?=#\s)/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const lines = block.split("\n");
    const title = lines[0].replace(/^#\s*/, "").trim();

    let i = 1;
    const meta: Record<string, string> = {};
    while (i < lines.length && /^[a-z]+:\s?/i.test(lines[i])) {
      const colon = lines[i].indexOf(":");
      meta[lines[i].slice(0, colon).trim().toLowerCase()] = lines[i].slice(colon + 1).trim();
      i++;
    }

    return {
      title,
      shortInfo: meta.short ?? "",
      githubUrl: meta.github ?? "",
      reportUrl: meta.report || null,
      tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      longInfo: lines.slice(i).join("\n").trim(),
    };
  });
}
