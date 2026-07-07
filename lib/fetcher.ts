/* ═══════════════════════════════════════════════════════════════
   Shared SWR fetcher. Throws on non-2xx so SWR's built-in error
   retry (exponential backoff) heals transient failures — e.g. Neon
   cold starts returning one 500 before the DB wakes. Never resolve
   an error body as data: SWR would cache it as success and stop.
   ═══════════════════════════════════════════════════════════════ */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed (${res.status})`);
  return res.json();
}
