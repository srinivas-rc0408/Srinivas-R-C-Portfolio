import type { NextConfig } from "next";

/* Baseline security headers — the safe, non-breaking set. A strict
   Content-Security-Policy is intentionally omitted: the resume viewer loads
   the pdf.js worker from unpkg and the app relies on inline styles
   (styled-jsx + framer-motion), so an enforcing CSP needs a dedicated prod
   smoke-test before it can ship without breaking those. These headers carry
   real value (clickjacking, MIME-sniffing, referrer leakage, feature access)
   with zero risk to the current build. */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  images: {
    // Next 16 only serves whitelisted qualities; the hammock reveal asks for 100.
    qualities: [75, 100],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
