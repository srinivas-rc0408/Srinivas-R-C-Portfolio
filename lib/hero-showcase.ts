/* ═══════════════════════════════════════════════════════════════
   HERO SHOWCASE CONFIG
   Four characters rotate on the hero's right edge. Each radiates its
   own logo as a glowing aura DIRECTLY BEHIND it (the character overlaps
   the logo — "aura-farming" look), over a per-character background wash.

   The character fills a responsive stage box (object-contain, bottom-
   right) so it fits every viewport; `charScale`/offsets fine-tune each
   framing, `logoScale` sizes the aura relative to the stage.
   See public/heroes/manifest.json for trimmed dimensions.
   ═══════════════════════════════════════════════════════════════ */

export interface HeroConfig {
  id: string;
  character: string; // /heroes/*.png
  logo: string; // /heroes/logo-*.png
  theme: {
    bgFrom: string; // radial wash center
    bgTo: string; // falloff → site base #050508
    accent: string; // location dot, glows, Ask-AI border while active
  };
  /* Character: fills the stage box, then scaled/nudged per framing. */
  charScale: number;
  charOffsetX: string; // +% bleeds off the right edge
  charOffsetY: string;
  /* Aura logo: centered behind the character, sized vs the stage box. */
  logoScale: number; // fraction of stage width (may exceed 1 to spill)
  logoOpacity: number;
  logoOffsetX: string;
  logoOffsetY: string;
}

export const HEROES: HeroConfig[] = [
  {
    // 620×1926 — tall back view, designed to bleed off the right edge
    id: "spiderman",
    character: "/heroes/spider_man.png",
    logo: "/heroes/logo-spiderman.png",
    theme: { bgFrom: "#1a0508", bgTo: "#050508", accent: "#DC2626" },
    charScale: 1.16,
    charOffsetX: "10%",
    charOffsetY: "0%",
    logoScale: 0.78,
    logoOpacity: 0.2,
    logoOffsetX: "-14%",
    logoOffsetY: "-6%",
  },
  {
    // 797×1104 — upper body, bleeds bottom
    id: "ironman",
    character: "/heroes/ironman.png",
    logo: "/heroes/logo-ironman.png",
    theme: { bgFrom: "#1f0a05", bgTo: "#050508", accent: "#f59e0b" },
    charScale: 1.14,
    charOffsetX: "-2%",
    charOffsetY: "0%",
    logoScale: 0.82,
    logoOpacity: 0.18,
    logoOffsetX: "-6%",
    logoOffsetY: "-8%",
  },
  {
    // 494×1061 — half-frame side profile, right-weighted on purpose
    id: "batman",
    character: "/heroes/batman.png",
    logo: "/heroes/logo-batman.png",
    theme: { bgFrom: "#0d0f14", bgTo: "#050508", accent: "#f5d90a" },
    charScale: 1.16,
    charOffsetX: "6%",
    charOffsetY: "0%",
    logoScale: 1.05, // wide short bat ellipse — bigger to read as an aura
    logoOpacity: 0.2,
    logoOffsetX: "-12%",
    logoOffsetY: "-16%",
  },
  {
    // 814×689 — full body, wide cape, floats free
    id: "superman",
    character: "/heroes/superman.png",
    logo: "/heroes/logo-superman.png",
    theme: { bgFrom: "#0a1428", bgTo: "#050508", accent: "#3b82f6" },
    charScale: 1.3,
    charOffsetX: "-4%",
    charOffsetY: "0%",
    logoScale: 0.9,
    logoOpacity: 0.18,
    logoOffsetX: "-8%",
    logoOffsetY: "-12%",
  },
];

export const HERO_INTERVAL_MS = 6_500;
