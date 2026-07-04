# SPIDER-MAN ASSET SPEC — Srinivas RC Portfolio
> All numbers below are measured from the actual PNG files, not estimated.
> Every value is law. Claude Code must read this file fully before Phase 3.

---

## 1. VERIFIED ASSET MANIFEST

| File | Original W×H | Content box (L,T,R,B) | Trimmed W×H | Style | Role | Status |
|------|-------------|----------------------|-------------|-------|------|--------|
| 1.png | 840×859 | 178, 0, 663, 856 | 485×856 | movie (TASM) | **ENTRY — locked** | web exits top at 49.8% (post-trim 49.5%) |
| 2.png | 800×800 | 29, 67, 771, 733 | 742×666 | movie (FFH red/black) | carousel | ok |
| 3.png | 310×333 | 27, 27, 282, 306 | 255×279 | cartoon | CUT from carousel → game popups / 404 | low-res |
| 5.png | 350×350 | 5, 6, 345, 344 | 340×338 | cartoon | CUT from carousel → game popups / 404 | low-res |
| 6.png | 840×1032 | 180, 40, 659, 992 | 479×952 | cartoon (Ultimate) | carousel | BLOCKED — watermark on torso. Skip until replaced. |
| 7.png | 900×1380 | 40, 270, 877, 1160 | 837×890 | cartoon (Ultimate) | carousel | ok |
| 8.png | 840×859 | 136, 2, 705, 855 | 569×853 | movie (Homecoming) | carousel — hanging | web exits top at 45.1% (post-trim 42.5%) |
| 9.png | 523×1080 | 80, 25, 421, 1055 | 341×1030 | movie (Homecoming) | carousel | tall/narrow |
| 10.png | 840×859 | 3, 215, 839, 641 | 836×426 | movie (Homecoming) | carousel | wide swing pose |
| 11.png | 800×282 | 0, 69, 800, 276 | 800×207 | movie (Homecoming) | **SCROLL REVEAL — hammock** | webs touch both edges → full-bleed |
| 12.png | 1920×1000 | 609, 23, 1920, 878 | 1311×855 | comic/painted | carousel | MUST trim — 609px dead padding left |
| 14.png | 512×743 | 76, 282, 441, 743 | 365×461 | movie (FFH dark) | carousel | transparent (verified alpha) |
| 15.png | — | — | — | — | REMOVED from plan | never provided |

**Final carousel order (style-grouped, not random):** 2 → 8 → 9 → 10 → 14 → 12 → 7. Shuffle the *starting index* once per session for variety; the sequence stays grouped so movie-realistic and cartoon frames never jarringly alternate.

---

## 2. IMAGE PREP SCRIPT — `scripts/prep_spiderman.py`

Copy this file **verbatim**. It reads originals from `raw-assets/` and writes trimmed PNGs + `manifest.json` into `public/spiderman/`. Requires `pip install Pillow`.

```python
# scripts/prep_spiderman.py
from PIL import Image
from pathlib import Path
import json

SRC = Path("raw-assets")          # 12 original PNGs live here
OUT = Path("public/spiderman")    # trimmed output
OUT.mkdir(parents=True, exist_ok=True)

FILES = ["1.png","2.png","3.png","5.png","6.png","7.png",
         "8.png","9.png","10.png","11.png","12.png","14.png"]
WEB_FILES = {"1.png", "8.png"}    # hanging images — web thread must stay at top edge

manifest = {}
for name in FILES:
    im = Image.open(SRC / name).convert("RGBA")
    alpha = im.split()[3]
    bbox = alpha.point(lambda p: 255 if p > 10 else 0).getbbox()
    l, t, r, b = bbox
    if name in WEB_FILES:
        t = 0                     # never cut the web thread's top anchor
    trimmed = im.crop((l, t, r, b))
    trimmed.save(OUT / name, optimize=True)

    entry = {"w": trimmed.width, "h": trimmed.height}
    if name in WEB_FILES:
        cols = [x for x in range(trimmed.width)
                for y in range(4) if trimmed.getpixel((x, y))[3] > 10]
        entry["webX"] = round((min(cols) + max(cols)) / 2 / trimmed.width, 4)
    manifest[name] = entry

(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest, indent=2))
```

### `manifest.json` shape (produced by the script above)
```json
{
  "1.png":  { "w": 485,  "h": 856,  "webX": 0.4948 },
  "2.png":  { "w": 742,  "h": 666 },
  "8.png":  { "w": 569,  "h": 853,  "webX": 0.4253 },
  "11.png": { "w": 800,  "h": 207 }
}
```
Non-hanging images have `{w, h}` only. `webX` appears **only** for entries in `WEB_FILES`. This shape is consumed at build time; runtime code reads from `lib/spiderman-assets.ts` (below), not from the JSON.

Serve trimmed files through `next/image` — it auto-converts to WebP/AVIF. `priority` on 1.png only; everything else lazy.

---

## 3. TYPESCRIPT CONFIG — `lib/spiderman-assets.ts`

Copy this file **verbatim**.

```ts
export type SpideyAnchor = "bottom" | "top-web";
export type SpideyStyle = "movie" | "cartoon" | "comic";

export interface SpideyAsset {
  src: string;        // path under /public/spiderman (trimmed)
  w: number;          // trimmed intrinsic width
  h: number;          // trimmed intrinsic height
  anchor: SpideyAnchor;
  style: SpideyStyle;
  webX?: number;      // fraction of width where web thread exits top edge
}

export const ENTRY: SpideyAsset = {
  src: "/spiderman/1.png", w: 485, h: 856,
  anchor: "top-web", style: "movie", webX: 0.495,
};

export const CAROUSEL: SpideyAsset[] = [
  { src: "/spiderman/2.png",  w: 742,  h: 666,  anchor: "bottom",  style: "movie"   },
  { src: "/spiderman/8.png",  w: 569,  h: 853,  anchor: "top-web", style: "movie",  webX: 0.425 },
  { src: "/spiderman/9.png",  w: 341,  h: 1030, anchor: "bottom",  style: "movie"   },
  { src: "/spiderman/10.png", w: 836,  h: 426,  anchor: "bottom",  style: "movie"   },
  { src: "/spiderman/14.png", w: 365,  h: 461,  anchor: "bottom",  style: "movie"   },
  { src: "/spiderman/12.png", w: 1311, h: 855,  anchor: "bottom",  style: "comic"   },
  { src: "/spiderman/7.png",  w: 837,  h: 890,  anchor: "bottom",  style: "cartoon" },
  // 6.png re-enters here ONLY after a watermark-free replacement is prepped
];

export const HAMMOCK: SpideyAsset = {
  src: "/spiderman/11.png", w: 800, h: 207,
  anchor: "bottom", style: "movie",
};

// Reserved for Phaser game unlock popups / 404 page — never the hero:
export const SMALL_CARTOON: Pick<SpideyAsset, "src" | "w" | "h">[] = [
  { src: "/spiderman/3.png", w: 255, h: 279 },
  { src: "/spiderman/5.png", w: 340, h: 338 },
];

export const CAROUSEL_INTERVAL_MS = 5500;
```

**Every `webX` in the file is authoritative — the two measured values are 0.495 (1.png) and 0.425 (8.png); no other image needs `webX` because no other image is `anchor: "top-web"`.**

---

## 4. LAYOUT SPEC — `.spidey-stage` CSS

The hero is `position: relative; height: 100svh`. Copy this CSS **verbatim** into `app/globals.css` (or the hero's module CSS if scoped).

```css
/* Spider-Man stage — bottom edge sits at exactly 65vh from viewport top */
.spidey-stage {
  position: absolute;
  right: 4vw;
  bottom: 35svh;                          /* 100 − 65 */
  width: clamp(300px, 27vw, 440px);
  height: 60svh;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 5;                             /* above Three.js bg, below header/menu */
}
.spidey-stage[data-anchor="bottom"]  { align-items: flex-end; }
.spidey-stage[data-anchor="top-web"] { align-items: flex-start; }

.spidey-stage img {
  max-width: 100%;
  max-height: 100%;
  width: auto; height: auto;
  object-fit: contain;
}

/* Web line — CHILD of the animated element so it bounces with Spider-Man.
   200vh height guarantees the top never enters the viewport mid-bounce,
   so it always reads as anchored to the ceiling. */
.web-line {
  position: absolute;
  bottom: calc(100% - 2px);               /* starts where the PNG's web ends */
  left: calc(var(--web-x) * 100%);        /* --web-x: 0.495 for 1.png, 0.425 for 8.png */
  transform: translateX(-50%);
  width: 1.5px;
  height: 200vh;
  background: linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0.5));
}

@media (max-width: 767px) {
  .spidey-stage {
    width: clamp(180px, 46vw, 280px);
    bottom: 42svh;                        /* entry lands at 58svh on mobile */
  }
}
```

Render the `.web-line` element only when the active asset has `anchor === "top-web"`; set `--web-x` inline from that asset's `webX`. Popup cards (game demo video etc.) occupy the remaining `~30svh` below the stage on the right column. Below 768px: entry image + hammock stay, carousel is disabled.

---

## 5. FRAMER MOTION VARIANTS — `lib/spiderman-motion.ts`

Copy this file **verbatim**. All spring and easing values are authoritative.

```ts
import type { Variants, Transition } from "framer-motion";

/* ---- ENTRY DROP (1.png) ---------------------------------------- */
/* Original spec was damping 8 → 4–5 oscillations, reads janky.
   damping 11 = two confident bounces, still playful.                */
export const entryDrop: Variants = {
  hidden:  { y: -600, opacity: 0 },
  visible: {
    y: 0, opacity: 1,
    transition: { type: "spring", mass: 1.5, stiffness: 50, damping: 11 },
  },
};

/* ---- CAROUSEL CROSSFADE (pull-focus) ---------------------------- */
/* Animates `filter` — the ONE scoped exception to the transform/opacity
   rule. blur() is GPU-composited in modern browsers. Never animate
   filter anywhere else in the app.                                   */
const focusEase: Transition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] };
export const crossfade: Variants = {
  enter:  { opacity: 0, scale: 0.94, filter: "blur(8px)" },
  center: { opacity: 1, scale: 1,    filter: "blur(0px)", transition: focusEase },
  exit:   { opacity: 0, scale: 1.06, filter: "blur(8px)", transition: focusEase },
};
/* Use <AnimatePresence mode="popLayout"> keyed by src.
   Preload the NEXT image 1.5s before each swap: new Image().src = next. */

/* ---- HAMMOCK SCROLL REVEAL (11.png) ----------------------------- */
export const hammockReveal: Variants = {
  hidden:  { opacity: 0, y: 64, scaleY: 0.92 },
  visible: {
    opacity: 1, y: 0, scaleY: 1,
    transition: { type: "spring", stiffness: 60, damping: 13 },
  },
};

/* After reveal completes, start the idle sway (skip if reduced motion): */
export const hammockSway = {
  y: [0, -5, 0],
  rotate: [0, 0.3, 0],
  transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const },
};
```

### Hammock component contract
```tsx
// Top of Section 2, FULL-BLEED — the webs in 11.png touch both image
// edges, so at width:100vw it reads as strung across the entire screen.
<motion.div
  variants={hammockReveal}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.35 }}
  style={{ width: "100vw", transformOrigin: "top center" }}
  onAnimationComplete={startSwayUnlessReducedMotion}
>
  <Image src={HAMMOCK.src} width={800} height={207} sizes="100vw"
         style={{ width: "100%", height: "auto" }} alt="" />
</motion.div>
```
At 1440px viewport this renders ~372px tall — a natural divider band between hero and the three action cards. `prefers-reduced-motion`: render static, fully visible, no sway.

---

## 6. HERO RULES SUMMARY (for Phase 3's page.tsx refactor)

- **1.png = LOCKED ENTRY.** Drops from top on load with `entryDrop`. Bottom edge lands at 65svh right side. Web line child at 49.5% width.
- **Carousel = 2, 8, 9, 10, 14, 12, 7** in that style-grouped order (6 only after watermark-free replacement). 5.5s interval, `crossfade` variants only. 8.png shows the web line at 42.5% width, top-anchored.
- **11.png = SCROLL REVEAL, not carousel.** Full-bleed at the top of Section 2. `hammockReveal` spring on `whileInView` (once), then infinite `hammockSway`. Static under reduced motion.
- **3.png + 5.png = game/404 assets only.** Never in the hero.
- **15.png does not exist.** Carousel disabled entirely on mobile (<768px).
