/* ═══════════════════════════════════════════════════════════════
   HERO SHOWCASE CONFIG
   Four characters rotate on the hero's right edge, each with its
   own page-background wash, accent color, and logo watermark.
   Per-character stage numbers exist because the four source images
   have completely different framings (see public/heroes/manifest.json
   for trimmed dimensions + which edges each image bleeds off).
   ═══════════════════════════════════════════════════════════════ */

export interface HeroConfig {
  id: string;
  character: string; // /heroes/*.png
  logo: string; // /heroes/logo-*.png
  theme: {
    bgFrom: string; // radial wash center color
    bgTo: string; // wash falloff — always the site base #050508
    accent: string; // location dot, glows, Ask-AI border while active
  };
  stage: {
    width: string; // per-character clamp — img box width inside the fixed stage
    align: "bottom" | "center";
    offsetX: string; // positive pushes off the right edge (bleed), negative pulls inward
    offsetY: string;
  };
  logoStyle: {
    width: string;
    opacity: number; // 0.07–0.10 — ambient watermark, never a sticker
    offsetX: string; // translate from the stage's right edge, in logo-widths
    offsetY: string;
  };
}

export const HEROES: HeroConfig[] = [
  {
    // 620×1926 — back view, bleeds right+bottom: lives flush on the right edge
    id: "spiderman",
    character: "/heroes/spider_man.png",
    logo: "/heroes/logo-spiderman.png",
    theme: { bgFrom: "#1a0508", bgTo: "#050508", accent: "#DC2626" },
    stage: { width: "clamp(150px, 16vw, 250px)", align: "bottom", offsetX: "3%", offsetY: "0%" },
    logoStyle: { width: "34svh", opacity: 0.09, offsetX: "-105%", offsetY: "-8%" },
  },
  {
    // 797×1104 — upper body, bleeds bottom: bust sits on the stage floor
    id: "ironman",
    character: "/heroes/ironman.png",
    logo: "/heroes/logo-ironman.png",
    theme: { bgFrom: "#1f0a05", bgTo: "#050508", accent: "#f59e0b" },
    stage: { width: "clamp(300px, 30vw, 470px)", align: "bottom", offsetX: "-3%", offsetY: "0%" },
    logoStyle: { width: "30svh", opacity: 0.08, offsetX: "-150%", offsetY: "-10%" },
  },
  {
    // 494×1061 — half-frame side profile, bleeds right+bottom: right-weighted on purpose
    id: "batman",
    character: "/heroes/batman.png",
    logo: "/heroes/logo-batman.png",
    // near-pure black with a faint cold blue-grey cast (the "rim")
    theme: { bgFrom: "#0d0f14", bgTo: "#050508", accent: "#f5d90a" },
    stage: { width: "clamp(200px, 22vw, 330px)", align: "bottom", offsetX: "0%", offsetY: "0%" },
    logoStyle: { width: "52svh", opacity: 0.1, offsetX: "-70%", offsetY: "-30%" },
  },
  {
    // 814×689 — full body, wide cape, floats free: pulled slightly inward
    id: "superman",
    character: "/heroes/superman.png",
    logo: "/heroes/logo-superman.png",
    // dark desaturated navy — NOT light blue; white text must keep ~4.5:1
    theme: { bgFrom: "#0a1428", bgTo: "#050508", accent: "#3b82f6" },
    stage: { width: "clamp(380px, 36vw, 600px)", align: "bottom", offsetX: "-6%", offsetY: "0%" },
    logoStyle: { width: "48svh", opacity: 0.08, offsetX: "-45%", offsetY: "-25%" },
  },
];

export const HERO_INTERVAL_MS = 10_000;
