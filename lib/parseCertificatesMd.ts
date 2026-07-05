export interface ParsedCertificate {
  name: string;
  year: number;
  imageFile: string;
}

/** Parses content/certificates.md: "# Name" blocks with year/image metadata. */
export function parseCertificatesMd(raw: string): ParsedCertificate[] {
  const blocks = raw
    .split(/\n(?=#\s)/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const lines = block.split("\n");
    const name = lines[0].replace(/^#\s*/, "").trim();

    const meta: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
      const colon = lines[i].indexOf(":");
      if (colon === -1) continue;
      meta[lines[i].slice(0, colon).trim().toLowerCase()] = lines[i].slice(colon + 1).trim();
    }

    return {
      name,
      year: Number(meta.year) || new Date().getFullYear(),
      imageFile: meta.image ?? "",
    };
  });
}
