/** "5 Jul 2026 (Sunday)" — the "[date & day]" format used across DESIGN.md. */
export function formatDateWithDay(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const date = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(d);
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
  return `${date} (${day})`;
}
