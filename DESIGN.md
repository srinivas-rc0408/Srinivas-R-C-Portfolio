# DESIGN.md — Design System & Page Specs
Source of truth: Srinivas's 9 pages of handwritten sketches + SPIDERMAN-ASSETS-SPEC.md. When code and this file disagree, this file wins.

## 1. Design tokens
- **Background:** `#050508` (deep black). Hero section pitch black.
- **Accents:** `red-600` (#DC2626) primary; navy `#0F0F1A`, violet `#6C63FF` sparingly for UI chrome.
- **Text:** white `#FFFFFF` for name/headings; `white/70` body; `white/40` muted.
- **Surfaces:** glassmorphic — `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`.
- **Type scale:** massive display for "SRINIVAS.RC" (clamp ~3.5rem–7rem, tight tracking, white); section headings bold white; body normal.

## 2. Motion rules
- `transform` + `opacity` only. Sole exception: hero carousel `filter: blur()` crossfade.
- Every clickable: `whileTap={{ scale: 0.95 }}`; hover state visible.
- Menus/panels: Expo-out `ease: [0.22, 1, 0.36, 1]`, children stagger 0.1s.
- Case-opening roulette: heavy friction `ease: [0.15, 1, 0.3, 1]`, ~6s decel.
- Spider-Man springs + hammock: exact configs in SPIDERMAN-ASSETS-SPEC.md.
- All animation honors `prefers-reduced-motion` (render final state, no loops).
- 60fps target. Three.js/heavy particles never on mobile.

## 3. Page specs (from the drawings)

### Homepage — hero (100svh)
- Header (fixed, glass): ≡ trigger left · centered clickable "SRINIVAS R.C" (home) · 👤 Sign In right (opens modal, no navigation).
- LEFT column: profile photo circle → "SRINIVAS.RC" display text → "Bengaluru, Karnataka" → ONE about paragraph → [View Resume] [View more details] buttons → "Ask AI abt me" entry (Phase 11).
- RIGHT column: Spider-Man stage per spec (1.png drop, web line, 7-image carousel) with popup cards BELOW: 10-sec looped demo videos of the chest mechanic & game (Phase 10).

### Homepage — section 2 (on scroll)
- 11.png hammock: full-bleed scroll reveal at the very top of this section (never a background image).
- Sticky mini-header: SRINIVAS R.C · Bengaluru · ≡ · ↑ scroll-to-top.
- Three glass action cards: **Open Chest to See My Details** / **View All Details** / **Play My Portfolio Game** — fade up `whileInView`.

### Footer (every page)
"Connect with me" — logos ONLY (Instagram, Email, LinkedIn, GitHub, Steam, admin-editable) · **GIVE Feedback →** (mandatory, persists to DB) · "Portfolio last updated on [date & day]" · copyright.

### Hamburger side menu
Slides from left, glass blur, ≡ morphs to X/←, click-outside closes, bottom gradient fade. Order: ⭐ Portfolio Details (pinned) → Projects (folder-expand, ✓ on visited sub-items) → Resume (direct) → CV (direct) → View Other Details (→ Education → Certifications → …) → Connect with me (bottom).

### Resume / CV popup (identical layout)
Full-screen blur overlay · title "SRINIVAS R.C.'s Resume" · ← → page arrows · X close · scrollable PDF pages · bottom bar: "Updated on [date & day]" · … options · ↓ Download (registered users only) · M mail.

### Projects
List page: ← back, header, GitHub profile link, 🔍 search, 3-col card grid (name + short info + GitHub link), Done. Card click → detail page: full long info (markdown), GitHub link, back. **Two-tier info: short (1–2 lines, card) vs detailed (long-form, detail page).**

### Certifications
Grid: most recent slightly larger, rest uniform; hover tooltip "Tap to view"; after last: "More certifications yet to come". Click → detail popup: name, blur bg, large image, "Completed on [Year]", Share …/↓/M, Done.

### Other Details — ONE scrollable page
Education, Experience, Achievements, and all dynamic sections stacked on a single route; menu links scroll to anchors (IntersectionObserver scroll-spy highlights active item). Done button returns.

### Chest opening (CS2 style)
Full-screen blur · glowing chest, breathing animation (scale 1→1.03, 2.2s), cursor-tilt, "Click to Open" · click → anticipation squash/pop → 50-card weighted roulette (rarity tiers: gold/red/pink/purple/blue = Resume/CV/ArchAgent/other projects/Education+Experience+Achievements+Certifications), 6.2s custom-bezier decel with an 8-30px near-miss landing · synthesized Web Audio ticks + rarity reveal stinger, mute toggle persisted · center ▼ indicator · rarity-tiered reveal ceremony (particles, edge-flash, shake, gold pre-reveal silhouette) · "View [section]" + "Open Again" · reduced-motion skips the roulette for a 400ms crossfade. Details: `lib/case-items.ts`, `lib/case-audio.ts`, `src/components/CaseOpening.tsx`.

### Portfolio game (Phaser 4)
Full-screen top-down driving · 3 vehicles (motorcycle/car/bus, distinct physics) · WASD+arrows · 9 bus stops = 9 sections · stop reached → glass popup "Congrats you unlocked [Section]" + Click to View / Continue · nipplejs joystick on mobile · 150×150 minimap bottom-right · exit trip summary (distance, stops, time) → GameSession log.

### Admin (/admin, owner only)
Sidebar: Resume · CV · Projects · Certificates · Education · Experience · Achievements · Connect-with-me · Search · (i) pending changes · **Update Changes All** master save. Pattern everywhere: edits stage into pendingChanges, nothing writes to DB until Update Changes. Resume/CV pages: View Current, Upload New (↑, ✕ cancel), Make Private toggle. Projects: grid → per-project edit (inline rename, short info, long info, GitHub link ✓/✗, report PDF upload). Certificates: grid, + upload, select→Make Private w/ checkbox popup. Analytics: visitors, download log w/ estimated company, user table, game stats.

## 4. Non-negotiable quality bar
- Buttons respond <150ms perceived; modals close on X, click-outside, AND Escape.
- Lighthouse: desktop ≥85, mobile ≥75; FCP <1.8s on 4G.
- Phaser/Three loaded via `dynamic(() => import(...), { ssr: false })`.
- No content invented — all copy about Srinivas comes from `content/`.
