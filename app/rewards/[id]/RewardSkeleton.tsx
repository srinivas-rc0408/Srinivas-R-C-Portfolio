/* ═══════════════════════════════════════════════════════════════
   LOADING SKELETON — /rewards/[id]
   Pre-loading skeleton so the target page feels instant.
   ═══════════════════════════════════════════════════════════════ */

export default function RewardSkeleton() {
  return (
    <div
      className="flex min-h-screen w-screen flex-col items-center justify-center"
      style={{ background: "#000" }}
    >
      {/* Grainy texture (same as the reward page) */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Top rule skeleton */}
        <div
          className="h-px w-16 animate-pulse"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />

        {/* Badge skeleton */}
        <div
          className="h-3 w-28 animate-pulse rounded-sm"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />

        {/* Icon skeleton */}
        <div
          className="h-24 w-24 animate-pulse rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        />

        {/* Title skeleton */}
        <div
          className="h-8 w-48 animate-pulse rounded-sm"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />

        {/* Description skeletons */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="h-3 w-72 animate-pulse rounded-sm"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
          <div
            className="h-3 w-56 animate-pulse rounded-sm"
            style={{ background: "rgba(255,255,255,0.02)" }}
          />
        </div>

        {/* Decoding indicator */}
        <p
          className="text-[10px] font-medium tracking-[0.3em] uppercase animate-pulse"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          Decoding archive…
        </p>
      </div>
    </div>
  );
}
