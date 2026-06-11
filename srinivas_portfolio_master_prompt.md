# Srinivas RC — Portfolio Master Build Prompt
### Full-Stack Production Portfolio | Build Guide v1.0

---

> **How to use this document**
> This is a staged build guide. Each stage has a self-contained prompt you paste into Cursor, Claude Code, or v0. Build stage-by-stage. Do NOT try to build everything at once — you will get a broken, laggy mess. Complete Stage 1 before starting Stage 2, and so on. Each stage builds on the last.

---

## SECURITY NOTICE (Read Before Building)

**Never hardcode your real password or email into source code.** Use environment variables stored in a `.env` file that is listed in `.gitignore`. Your admin credentials must never appear in any public repository or chat.

```
# .env (never commit this file)
ADMIN_EMAIL=your_email@gmail.com
ADMIN_PASSWORD_HASH=bcrypt_hash_of_your_password
JWT_SECRET=random_64_char_string
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
DATABASE_URL=...
REDIS_URL=...
S3_BUCKET=...
```

---

## Tech Stack Decision

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend Framework | Next.js 14 (App Router) | SSR for SEO, easy routing, Vercel deploy |
| Styling | Tailwind CSS + Framer Motion | Utility classes + animation without fights |
| Background FX | Three.js / tsparticles | 3D particle systems, GPU-accelerated |
| Game Engine | Phaser 3 | Purpose-built 2D game, no DIY canvas hell |
| Auth | NextAuth.js v5 | Handles Google, GitHub, credentials in one lib |
| Backend | Next.js Route Handlers + Node.js | Same repo, less overhead |
| DB | PostgreSQL via Prisma ORM | Type-safe, easy migrations |
| Cache | Redis (Upstash) | Session cache, rate limiting |
| File Storage | Cloudflare R2 | S3-compatible, cheaper egress |
| PDF Generation | pdf-lib + sharp | Watermark injection in Node |
| Hosting | Vercel (frontend) + Railway (DB) | Free tiers work for portfolio |

---

## Stage 1 — Project Scaffold + Design System

**Paste this prompt into Claude Code or Cursor:**

```
Create a Next.js 14 project with App Router for a personal portfolio. 

Project name: srinivas-portfolio

Install these dependencies:
- tailwindcss, @tailwindcss/typography
- framer-motion
- three, @types/three
- @react-three/fiber, @react-three/drei
- tsparticles, react-tsparticles
- next-auth@beta
- prisma, @prisma/client
- @upstash/redis
- pdf-lib, sharp
- zod, react-hook-form
- lucide-react

Set up the folder structure:
app/
  (public)/
    page.tsx              ← Homepage
    game/page.tsx         ← Game page
    sections/page.tsx     ← Direct sections browser
    section/[slug]/page.tsx ← Individual section view
  (auth)/
    login/page.tsx
    register/page.tsx
  admin/
    page.tsx              ← Admin dashboard (protected)
  api/
    auth/[...nextauth]/route.ts
    download/route.ts
    analytics/route.ts
    content/route.ts
components/
  backgrounds/
    ParticleBackground.tsx
    ThreeBackground.tsx
    AmbientBackground.tsx
  game/
    GameCanvas.tsx
    BusStop.tsx
  home/
    GambleModal.tsx
    HeroSection.tsx
    NavigationHub.tsx
  sections/
    SectionCard.tsx
    DownloadButton.tsx
    WatermarkPDF.tsx
  admin/
    UserTable.tsx
    AnalyticsChart.tsx
lib/
  auth.ts
  db.ts
  redis.ts
  watermark.ts
  analytics.ts
prisma/
  schema.prisma

Create the Prisma schema with these models:
- User (id, name, email, phone?, passwordHash?, googleId?, githubId?, role, createdAt)
- Session (id, userId, token, expiresAt)  
- DownloadLog (id, userId?, guestName?, section, fileName, downloadedAt, ipAddress)
- ViewLog (id, userId?, guestName?, section, viewedAt, ipAddress)
- GameSession (id, userId?, guestName?, distanceTraveled, stopsVisited[], playedAt)
- AdminLog (id, action, targetUserId?, timestamp)

Create the Tailwind config with a custom color palette:
Primary: #0F0F1A (deep navy black)
Accent: #6C63FF (electric violet)
Secondary: #FF6584 (coral pink)
Surface: #1A1A2E (dark surface)
Text: #E8E8FF (near white)
Muted: #8888BB (muted lavender)

Set up global CSS with:
- Custom scrollbar (thin, accent colored)
- Font: Inter for body, Space Grotesk for headings (Google Fonts)
- CSS variables for all theme colors
- Base animations: fadeInUp, slideInLeft, glitch

Do NOT build any pages yet. Just scaffold, install, and configure.
```

---

## Stage 2 — Homepage with Live Background

**Paste this prompt:**

```
Build the Homepage (app/(public)/page.tsx) for Srinivas RC's portfolio.

BACKGROUND SYSTEM — implement a ParticleBackground component using tsparticles with these exact settings:
- Particle count: 120 (never go above 150 — causes lag on mobile)
- Particles are small dots (size: 2px, random between 1-3)
- Colors: mix of #6C63FF, #FF6584, #FFFFFF at low opacity (0.4-0.8)
- Motion: slow drift upward with slight horizontal oscillation
- On mouse hover: particles within 100px radius gently repel from cursor
- Connections: draw thin lines between particles within 80px, opacity 0.15
- The background is FIXED position, z-index: 0, pointer-events: none
- All page content is z-index: 10 or higher

HERO SECTION — centered, appears on page load with staggered Framer Motion animations:
- Animated text: "Srinivas R C" (large, Space Grotesk, 700 weight)
- Subtitle with typewriter effect cycling through: "AI/ML Engineer", "Full Stack Developer", "IoT Enthusiast", "REVA University, 2027"
- Brief bio: "Building production-grade systems at student scale."
- Three navigation buttons (large, glowing on hover):
  1. "EXPLORE" → scrolls to NavigationHub section
  2. "PLAY" → /game
  3. "GAMBLE" → opens GambleModal

NAVIGATION HUB — below hero, 3 columns:
Left: "Game Mode" card with controller icon → /game
Center: "Gamble Mode" card (highlighted, pulsing border) → opens GambleModal  
Right: "Browse All" card with grid icon → /sections

GUEST LOGIN PROMPT — sticky bottom bar (only shown if user not logged in):
"Enter your name to browse → [text input] [→ button]"
On submit: stores name in localStorage as guestName, hides the bar, enables browsing.

GAMBLE MODAL — full screen overlay, CS2 case opening mechanic:
- Dark backdrop with blur
- A horizontal scrolling strip (like a slot machine reel) containing section cards:
  Resume, Projects, CV, Skills, Experience, Education, Certifications, Open Source, Contact
- Each card in the strip shows: icon + section name
- "OPEN CASE" button → triggers spin animation:
  Phase 1 (0-3s): strip scrolls very fast (blur effect on cards)
  Phase 2 (3-6s): gradually decelerates using easeOutExpo
  Phase 3 (6-7s): stops, highlighted card snaps to center with a flash/glow effect
  Phase 4: "VIEW" button appears → navigates to that section
- Use CSS transforms and requestAnimationFrame for smooth animation — NOT setInterval
- The final selected section must be truly random (Math.random() weighted equally)
- Include a "Try Again" button to re-spin

IMPORTANT PERFORMANCE RULES:
- Particle background must use will-change: transform on particle canvas
- All Framer Motion animations must use layout and transform only (no top/left/margin animations)
- Gamble modal must use CSS contain: strict on the reel container
- Lazy load the GambleModal component with next/dynamic
- Guest name prompt uses localStorage, not a network call

Make the entire page responsive. Mobile: single column, particles reduced to 60.
```

---

## Stage 3 — Game Page (Phaser 3 Bus/Vehicle Game)

**Paste this prompt:**

```
Build the Game Page (app/(public)/game/page.tsx) for a 2D top-down driving game using Phaser 3.

Install: npm install phaser

GAME CONCEPT:
- Player drives a vehicle (bike/car/bus — let user choose at start) on a road track
- The road is a looping city map (top-down view)
- Around the map are 9 BUS STOPS, each named after a portfolio section:
  Stop 1: Resume
  Stop 2: Projects  
  Stop 3: CV
  Stop 4: Skills
  Stop 5: Experience
  Stop 6: Education
  Stop 7: Certifications
  Stop 8: Open Source
  Stop 9: Contact
- When the vehicle enters the hitbox of a bus stop (within 60px), a popup appears showing a preview of that section
- The popup has a "View Full" button → navigates to /section/[slug]
- Each bus stop has a sign sprite with the section name visible on the map

VEHICLE MECHANICS:
- WASD or Arrow keys for movement
- Vehicle has realistic turning (not teleporting — use arcade physics with drag/friction)
- Speed: max 200px/s, acceleration is gradual
- Vehicle cannot go off-road (collision with road boundaries)
- Mobile: on-screen virtual joystick (use nipplejs or a simple touch joystick)

MAP DESIGN:
- Tile-based map using Phaser Tilemaps
- Road tiles: dark grey, two-lane
- Sidewalk tiles: light grey
- Grass tiles: dark green (border areas)
- Bus stops: small shelter sprites at the side of the road
- Minimap: small 150x150px minimap in bottom-right corner showing player dot and stop locations

PERFORMANCE RULES:
- Phaser game must be initialized inside a useEffect with cleanup (game.destroy(true) on unmount)
- Use WebGL renderer (Phaser.AUTO falls back to Canvas — force WEBGL for performance)
- Sprite sheets must be loaded as atlases, not individual images
- Game canvas: width 100vw, height 100vh, with UI overlay (React) on top for popups
- Limit to 60fps with game.loop.targetFps = 60

BUS STOP POPUP (React overlay, not Phaser UI):
- When player enters stop, dispatch a custom event from Phaser: window.dispatchEvent(new CustomEvent('busStopEntered', { detail: { stopName, slug } }))
- React listens: window.addEventListener('busStopEntered', handler)
- Popup appears at bottom of screen (not center — player keeps visibility)
- Shows: stop name, a 2-line summary of that section, "View Full" CTA

ANALYTICS:
- Every 30 seconds of gameplay, POST to /api/analytics: { event: 'game_play', distanceTraveled, stopsVisited }
- On game exit/unmount, POST final session data

GAME STATE PERSISTENCE:
- Store in user's account (if logged in) or localStorage (if guest): totalDistanceDriven, stopsVisited[]
- Show a "Trip Summary" on exit: total distance, sections discovered, time played

VEHICLE SELECTOR (shown before game loads):
- Three options with icons: Motorcycle (fast, less stable), Car (balanced), Bus (slow, wide)
- Each has different Phaser physics values (speed, turn radius, friction)

Page background: the city map IS the background — no particle system on this page.
```

---

## Stage 4 — Sections Browser + Individual Section Pages

**Paste this prompt:**

```
Build the Sections Browser (app/(public)/sections/page.tsx) and individual section pages (app/(public)/section/[slug]/page.tsx) for Srinivas RC's portfolio.

SECTIONS BROWSER PAGE:
- Background: animated gradient that slowly shifts colors (deep navy → purple → dark teal) using CSS keyframes. NOT particles — a smooth color wash.
- Grid of 9 section cards (3x3 on desktop, 2 cols on tablet, 1 col on mobile)
- Each card:
  - Has a unique icon (lucide-react)
  - Section name (large, bold)
  - 1-line tagline
  - Hover: card lifts (translateY -8px), glowing border appears, background reveals section color
  - Click: navigate to /section/[slug]
- Cards animate in with staggered fadeInUp (Framer Motion, stagger 0.08s)

The 9 sections with their icons and colors:
1. resume → FileText icon → violet accent
2. projects → Code2 icon → blue accent
3. cv → Scroll icon → teal accent
4. skills → Cpu icon → green accent
5. experience → Briefcase icon → amber accent
6. education → GraduationCap icon → pink accent
7. certifications → Award icon → orange accent
8. open-source → Github icon → gray accent
9. contact → Mail icon → coral accent

INDIVIDUAL SECTION PAGE (/section/[slug]):
Each page has:
- Background: Three.js ambient background — slowly rotating geometric mesh (low poly sphere or torus) made of the section's accent color, wireframe style, very subtle, blurred. This is different per section slug.
- Back button (top left) → /sections
- Section title (large)
- Full content rendered from JSON/MDX content files
- DOWNLOAD BUTTON (shown only to logged-in users):
  - Text: "Download [Section Name]"
  - On click: POST to /api/download with { section: slug }
  - Backend generates watermarked PDF and returns a download URL
  - Show a loading spinner, then trigger download
- View tracking: on page load, POST to /api/analytics: { event: 'section_view', section: slug }

CONTENT STRUCTURE (lib/content/ directory):
Create JSON files for each section. Example for resume:
{
  "slug": "resume",
  "title": "Resume",
  "tagline": "One page. Everything that matters.",
  "lastUpdated": "2026-06-01",
  "sections": [
    { "heading": "Education", "items": [...] },
    { "heading": "Experience", "items": [...] },
    { "heading": "Projects", "items": [...] },
    { "heading": "Skills", "items": [...] }
  ]
}

Fill in with Srinivas RC's actual details:
- Education: B.Tech AI & ML, REVA University, Bengaluru, 2023–2027 (SRN: R23EA121)
- Projects: ArchAgent (React 19, TypeScript, Express.js, Supabase, Three.js, Gemini 2.0 Flash), Health Risk MLOps Pipeline (MLflow, FastAPI, Docker, GitHub Actions), Bank Churn System (React + TypeScript + Convex), NLP Language Detector, AI-Enhanced Flappy Bird (Java/JavaFX)
- Skills: Python, TypeScript, React, Node.js, FastAPI, Docker, MLflow, PostgreSQL, Three.js, Java
- Certifications: NPTEL Deep Learning (IIT Ropar, proctored), list others
- Experience: Head of Media, Yantra IoT Club, REVA University — organized workshops with speakers from major tech companies
- Open Source: GitHub: [his actual github handle]

DOWNLOAD AUTH GUARD:
- If user is NOT logged in and clicks Download: show a modal — "Create an account to download. Takes 30 seconds."
- Modal has: Register button, Login button, "Continue as guest (view only)" dismiss
```

---

## Stage 5 — Auth System (Guest + Registered + OAuth)

**Paste this prompt:**

```
Implement the full authentication system for Srinivas RC's portfolio using NextAuth.js v5.

AUTH FLOWS TO BUILD:

1. GUEST FLOW (no auth required):
   - User enters their name in the bottom bar on homepage
   - Name stored in localStorage key: 'guestName'
   - Guest can: browse all sections, play the game, use gamble mode
   - Guest CANNOT: download files
   - No API calls for guest login — pure client-side

2. REGISTERED USER FLOW:
   - Register page (/login → register tab):
     Fields: Full Name, Email, Phone Number (optional), Password, Confirm Password
     Validation with Zod: email format, password min 8 chars, passwords match
     On submit: POST to /api/auth/register
     Success: auto-login, redirect to /sections
   - Login page: Email + Password
   - After login: redirect back to where they were (use callbackUrl)

3. OAUTH FLOW:
   - "Continue with Google" button → Google OAuth → creates user in DB if new, logs in if existing
   - "Continue with GitHub" button → GitHub OAuth → same logic
   - OAuth users do NOT have a password — account is linked to OAuth provider

NextAuth.js v5 configuration (lib/auth.ts):
- Providers: Credentials, Google, GitHub
- Session strategy: jwt (not database sessions — simpler)
- JWT expires: 30 days
- On successful OAuth, check if user with that email exists — if yes, link account; if no, create new user
- Store in JWT: { userId, email, name, role }

Database operations needed (Prisma):
- createUser(data): hash password with bcrypt (rounds: 12), store hash (NEVER plain password)
- findUserByEmail(email): for login validation
- findOrCreateOAuthUser(provider, providerId, email, name): for OAuth

SECURITY REQUIREMENTS:
- Rate limit login endpoint: max 5 attempts per IP per 15 minutes (use Upstash Redis)
- All passwords hashed with bcrypt before storage
- JWT secret loaded from env.JWT_SECRET (minimum 64 characters)
- Admin routes protected by middleware checking role === 'admin'

USER HISTORY (store in DB for logged-in users):
- sections_viewed: array of section slugs with timestamps
- sections_downloaded: array of { slug, filename, downloadedAt }
- game_sessions: array of { distanceTraveled, stopsVisited, playedAt, duration }
- gamble_spins: count of total spins, array of results
- last_login: timestamp
- login_count: integer

Register and Login pages (/login):
- Tabbed UI: "Sign In" | "Create Account"
- Social buttons at top: Google, GitHub (with brand colors)
- Divider: "or continue with email"
- Form below
- Clean, minimal dark UI matching the portfolio theme
- No distracting backgrounds on auth pages — simple deep navy with a subtle grid pattern
```

---

## Stage 6 — Download System with Watermarking

**Paste this prompt:**

```
Build the download system with PDF watermarking for Srinivas RC's portfolio.

API ENDPOINT (app/api/download/route.ts):
POST /api/download
Body: { section: string }
Auth: require logged-in user (check NextAuth session)

WATERMARK LOGIC:
1. Load the base PDF for the requested section from Cloudflare R2 / local files
2. Using pdf-lib, add a diagonal watermark text across each page:
   Text: "Srinivas R C's [Section Name]" (e.g., "Srinivas R C's Resume")
   Font: Helvetica Bold
   Size: 48px
   Color: RGB(108, 99, 255) at 20% opacity (nearly transparent, visible on print)
   Rotation: -45 degrees
   Position: center of each page
   Repeat: tile the watermark 3x across each page (top, center, bottom)
3. Add a footer on each page: "Downloaded by: [user.name] | [user.email] | [ISO timestamp]"
   Font size: 8px, gray color, bottom margin
4. Return the watermarked PDF as a Blob with Content-Disposition: attachment; filename="SrinivasRC_[Section].pdf"

LOG THE DOWNLOAD:
- After successful PDF generation, insert into DownloadLog table:
  { userId, section, fileName, downloadedAt: new Date(), ipAddress: request.ip }

SECTIONS WITH DOWNLOADABLE FILES:
- resume → SrinivasRC_Resume.pdf (your actual resume)
- cv → SrinivasRC_CV.pdf (your actual CV)
- projects → SrinivasRC_Projects.pdf (generate from project JSON)
- certifications → SrinivasRC_Certifications.pdf
- open-source → SrinivasRC_OpenSource.pdf

For sections that don't have a static PDF, generate dynamically from content JSON:
- Use pdf-lib to create a formatted PDF from the section's JSON content
- Apply consistent styling: Space Grotesk headers, Inter body, accent color for headings

DOWNLOAD BUTTON COMPONENT (components/sections/DownloadButton.tsx):
- Shows "Download [Section]" with download icon
- States: idle → loading (spinner) → success (checkmark, brief) → idle
- If user not logged in: opens RegisterPromptModal instead of downloading
- Rate limit on client: disable button for 5 seconds after each download (prevent spam)
- Track download start: POST to /api/analytics: { event: 'download_start', section }

REGISTER PROMPT MODAL:
- Triggered when guest tries to download
- Clean modal with portfolio theme
- Headline: "Create a free account to download"
- Body: "It takes 30 seconds. You'll get access to download all sections with your name watermarked."
- Buttons: "Create Account" → /login?tab=register, "Already have one? Log in" → /login, "Maybe later" (dismiss)
```

---

## Stage 7 — Admin Dashboard

**Paste this prompt:**

```
Build the Admin Dashboard (app/admin/page.tsx) for Srinivas RC's portfolio.

ADMIN ACCESS CONTROL:
- Middleware (middleware.ts): if route starts with /admin, check JWT session
- If not logged in: redirect to /login?callbackUrl=/admin
- If logged in but role !== 'admin': return 403 page
- Admin role is set manually in the database for a specific email address
- Add a Prisma seed script that sets role = 'admin' for the admin email from process.env.ADMIN_EMAIL

ADMIN DASHBOARD LAYOUT:
Sidebar (left, 240px wide):
- Portfolio logo / "Admin Panel" text
- Navigation links: Overview, Users, Downloads, Views, Game Stats, Content Manager, Settings
- Logout button at bottom

Main content area (right):

OVERVIEW PAGE (default):
- 4 stat cards in a row:
  - Total Visitors (unique IPs + registered users this month)
  - Total Downloads (this month)
  - Total Views (section views this month) 
  - Active Users (logged in in last 7 days)
- Line chart (use recharts): daily visitors over last 30 days
- Bar chart: section views by section name
- Recent activity feed: last 20 events (downloads, logins, game sessions) with timestamps

USERS PAGE:
- Searchable table: Name, Email, Phone, Registration Date, Last Login, Downloads Count, Role
- Sortable columns
- Click on user row: expand to show their full history:
  - Sections viewed (with timestamps)
  - Files downloaded (section, date, filename)
  - Game sessions (distance, stops visited, duration)
  - Gamble spins (count, results)
- Filter: All | Registered | OAuth | Active | Inactive

DOWNLOADS PAGE:
- Table: User Name, User Email, Section Downloaded, Filename, Download Date, IP Address
- Filterable by section and date range
- Export to CSV button

VIEWS PAGE:
- Table: Section, View Count, Unique Viewers, Last Viewed
- Heatmap-style visualization: grid of sections with color intensity based on views

GAME STATS PAGE:
- Total game sessions
- Average distance traveled
- Most visited bus stops (bar chart)
- Total playtime across all users

CONTENT MANAGER PAGE:
- List of all sections with their current content
- Edit button per section → opens a simple JSON editor or form-based editor
- Changes saved to the content JSON files
- "Regenerate PDF" button: triggers /api/admin/regenerate-pdf for that section

SETTINGS PAGE:
- Admin email display (read-only)
- Change admin password form (current password + new password + confirm)
- Download rate limits: set max downloads per user per day (default: 10)
- Maintenance mode toggle: shows "Site under maintenance" to all non-admin visitors

SECURITY REQUIREMENTS FOR ADMIN:
- All admin API routes must check: session exists AND session.user.role === 'admin'
- Admin actions logged to AdminLog table
- Session timeout for admin: 2 hours (shorter than regular users)
- Failed admin login attempts trigger email alert (use Resend or Nodemailer)

IMPORTANT PERFORMANCE NOTES:
- All admin data fetches use React Server Components where possible
- Client components only for interactive charts and tables
- Use SWR or React Query for client-side data that needs real-time updates
- Paginate all tables: 25 rows per page, use cursor-based pagination (not offset)
```

---

## Stage 8 — Polish, Performance & Deployment

**Paste this prompt:**

```
Final polish pass for Srinivas RC's portfolio. Fix performance, SEO, and prepare for deployment.

PERFORMANCE AUDIT — implement all of these:

1. Three.js backgrounds:
   - Use React.memo on all Three.js background components
   - Dispose geometry, material, renderer on useEffect cleanup (prevent memory leaks)
   - Use useReducedMotion() from Framer Motion — if true, disable all animated backgrounds, show static gradient instead
   - Detect mobile (navigator.maxTouchPoints > 0) — if mobile, use tsparticles instead of Three.js (lighter)

2. Images:
   - All images use next/image with explicit width/height
   - Project screenshots: serve as WebP, max 800px wide

3. Code splitting:
   - Phaser 3 game: dynamic import with ssr: false and loading fallback
   - Three.js components: dynamic import with ssr: false
   - GambleModal: dynamic import with ssr: false
   - Admin charts: dynamic import

4. Font loading:
   - Use next/font for Google Fonts (Space Grotesk + Inter)
   - preload: true, display: 'swap'

5. API routes:
   - Add response caching headers to content endpoints: Cache-Control: s-maxage=3600, stale-while-revalidate
   - Download endpoint: add rate limit per user (max 20 downloads per hour via Redis)

SEO:
- Add metadata export to every page with appropriate title, description, og:image
- og:image: generate a static PNG preview using @vercel/og
- Add robots.txt: allow all, disallow /admin
- Add sitemap.xml generated at build time

ERROR HANDLING:
- Global error boundary (app/error.tsx): styled with portfolio theme, shows "Something went wrong" with home button
- Not found page (app/not-found.tsx): styled 404 with animated glitch text effect
- All API routes return proper status codes and JSON error bodies

ENVIRONMENT VARIABLES (create .env.example):
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
ADMIN_EMAIL=
RESEND_API_KEY=

DEPLOYMENT CHECKLIST:
1. Push to GitHub (ensure .env is in .gitignore)
2. Connect to Vercel: set all env variables in Vercel dashboard
3. Set up PostgreSQL on Railway or Neon (free tier)
4. Run: npx prisma db push (creates tables)
5. Run seed: npx ts-node prisma/seed.ts (creates admin user with role='admin')
6. Set up Upstash Redis (free tier)
7. Upload base PDFs to Cloudflare R2
8. Test: guest flow, register, OAuth login, download with watermark, admin dashboard, game page

TESTING BEFORE LAUNCH:
- Test on Chrome, Firefox, Safari (especially the Three.js backgrounds)
- Test on mobile (Chrome Android, Safari iOS)
- Test the particle background — if FPS drops below 55 on mobile, reduce particle count
- Test the game on mobile with touch controls
- Test download watermarking — open generated PDF and verify watermark is diagonal and readable
- Test admin dashboard with 50+ dummy entries to verify pagination
```

---

## Recommended Build Order Summary

| Stage | What You Build | Est. Time |
|-------|---------------|-----------|
| 1 | Scaffold + dependencies + Prisma schema | 1 hour |
| 2 | Homepage + particles + gamble modal | 3-4 hours |
| 3 | Game page (Phaser 3) | 4-6 hours |
| 4 | Sections browser + individual pages | 2-3 hours |
| 5 | Auth (guest + register + OAuth) | 3-4 hours |
| 6 | Download + watermarking | 2-3 hours |
| 7 | Admin dashboard | 3-4 hours |
| 8 | Polish + deploy | 2 hours |
| **Total** | | **~20-27 hours** |

---

## Key Technical Pitfalls to Avoid

**1. Phaser + Next.js SSR crash**
Phaser uses `window` on import. Always:
```javascript
const GameComponent = dynamic(() => import('@/components/game/GameCanvas'), { ssr: false })
```

**2. Three.js memory leaks**
Every Three.js component MUST clean up:
```javascript
useEffect(() => {
  const { scene, renderer, geometry, material } = setup()
  return () => {
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    scene.clear()
  }
}, [])
```

**3. Particle lag on mobile**
Never use Three.js particles on mobile. Detect and switch:
```javascript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
return isMobile ? <TsParticlesBackground /> : <ThreeBackground />
```

**4. PDF watermark opacity**
Opacity of 0.15 is too faint on screen. Use 0.20 for screen viewing, acceptable on print.

**5. CS2 case animation smoothness**
Do NOT use setInterval for the reel animation. Use:
```javascript
const animate = (timestamp) => {
  // update position
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
```

**6. Admin route security**
Never rely only on frontend route guards. Every admin API call must verify session on the server:
```javascript
const session = await getServerSession()
if (!session || session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## Portfolio Content Checklist (Fill Before Deploying)

- [ ] Upload actual resume PDF to R2
- [ ] Upload actual CV PDF to R2
- [ ] Fill projects JSON with real GitHub links and descriptions
- [ ] Add actual NPTEL certificate PDF
- [ ] Add profile photo (WebP, square, min 400x400px)
- [ ] Write contact section (email, LinkedIn, GitHub — NOT phone number publicly)
- [ ] Test all download watermarks with your real name

---

*Generated for Srinivas R C | Portfolio Build Guide v1.0*
*Architecture reviewed: June 2026*
