import { UAParser } from "ua-parser-js";

/* ═══════════════════════════════════════════════════════════════
   RECRUITER INTEL — best-effort visitor context for DownloadLog.
   Ported from the main-branch RecruiterTracker/download route.
   Never blocks or fails the download it's attached to.
   ═══════════════════════════════════════════════════════════════ */

export function summarizeUserAgent(userAgentString: string): string {
  const { browser, os, device } = new UAParser(userAgentString).getResult();
  return `${browser.name || "Unknown Browser"} on ${os.name || "Unknown OS"} (${device.type || "desktop"})`;
}

/** Best-effort org/ISP lookup from IP via ip-api.com. Null on any failure — never throws. */
export async function estimateCompany(ip: string): Promise<string | null> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") return null;

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=isp,org`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.isp) return null;

    return data.org ? `${data.org} (${data.isp})` : data.isp;
  } catch {
    return null;
  }
}
