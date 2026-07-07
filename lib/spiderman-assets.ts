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
  { src: "/spiderman/8.png",  w: 569,  h: 855,  anchor: "top-web", style: "movie",  webX: 0.425 },
  { src: "/spiderman/9.png",  w: 341,  h: 1030, anchor: "bottom",  style: "movie"   },
  { src: "/spiderman/10.png", w: 836,  h: 426,  anchor: "bottom",  style: "movie"   },
  { src: "/spiderman/14.png", w: 365,  h: 411,  anchor: "bottom",  style: "movie"   },
  { src: "/spiderman/12.png", w: 1311, h: 855,  anchor: "bottom",  style: "comic"   },
  { src: "/spiderman/7.png",  w: 837,  h: 890,  anchor: "bottom",  style: "cartoon" },
  // 6.png re-enters here ONLY after a watermark-free replacement is prepped
];

// 11@2x.png = Lanczos 2.5x upscale of the trimmed 800x207 source, so the
// scroll reveal serves near-2K sharp at desktop render widths.
export const HAMMOCK: SpideyAsset = {
  src: "/spiderman/11@2x.png", w: 2000, h: 517,
  anchor: "bottom", style: "movie",
};

// Reserved for Phaser game unlock popups / 404 page — never the hero:
export const SMALL_CARTOON: Pick<SpideyAsset, "src" | "w" | "h">[] = [
  { src: "/spiderman/3.png", w: 255, h: 279 },
  { src: "/spiderman/5.png", w: 340, h: 338 },
];

export const CAROUSEL_INTERVAL_MS = 5500;
