# CLAUDE.md — Srinivas R C Portfolio

## What this project is
Spider-Man-themed personal portfolio for Srinivas R C (B.Tech AI&ML, REVA University, Bengaluru, graduating 2027). Public gamified portfolio + admin CMS. Branch of record: `next16-main`. The `main` branch is an OLD Next 14 version kept only as a parts donor — never merge it, only port specific files from it when a phase says so.

## Tech stack (locked — do not add or swap without asking)
- Next.js 16 App Router, React 19, TypeScript `strict: true`
- Tailwind CSS 4, Framer Motion 12
- Prisma + Neon Postgres (`DATABASE_URL` in `.env` — NEVER print, log, or commit it)
- Auth: custom JWT via `jose` (NOT NextAuth)
- Phaser 4 (game), Resend (email), SWR (fetching), fuse.js (search)
- Later phases add: Cloudflare R2 (`@aws-sdk/client-s3`), `pdf-lib`, `react-pdf`, `@upstash/ratelimit`, `nipplejs`

## Files you must read before touching related code
- `DESIGN.md` — design system, page layouts, animation rules. Law.
- `SPIDERMAN-ASSETS-SPEC.md` — measured Spider-Man asset specs. Every number is law.
- `ROADMAP.md` — phase status. Update the checkbox when a phase completes.

## Global rules (apply to every task)
1. **Straightforward UX.** Every button does one obvious thing, instantly. No clever multi-step interactions nobody asked for.
2. **Complete files only.** Never output TODOs, placeholders, or "rest stays the same".
3. **No redesigns.** Match the existing design language exactly (see DESIGN.md). Alignment and polish, not reinvention.
4. **Animations:** `transform` + `opacity` only. One exception: the hero carousel blur crossfade. Everything animated respects `prefers-reduced-motion`. Every clickable gets `whileTap={{ scale: 0.95 }}`.
5. **One phase at a time.** Finish → verify → `git commit` (descriptive message) → STOP and report. Never batch phases into one commit. Push after every phase.
6. **DB access is Prisma only.** No raw SQL, no sqlite imports. Client singleton: `lib/db.ts` (respect the `@/*` alias in tsconfig).
7. **Schema changes:** edit `prisma/schema.prisma`, run `npx prisma db push` + `npx prisma generate`. Never hand-write migrations against Neon.
8. **Verify before reporting:** `npm run build` must pass with zero TS errors; dev-server click-through of affected pages.
9. **Content comes from `content/`** (owner-written). If required content is missing, STOP and ask — do not invent filler text about Srinivas.
10. **Secrets:** anything in `.env` stays in `.env`. If a new key is needed, add a placeholder line to `.env.example` and tell the owner.

## Skill directives
- **ponytail:** highest priority — on every close call choose less code and simpler structure.
- **superpowers:** TDD only for API routes and Prisma logic. Never write tests for animations or visual components.
- **impeccable / frontend-design:** dormant except during explicit polish/QA phases.
- Never create new skills or browse the skill marketplace during build sessions.

## Known landmines
- Two historical CaseOpening components existed; only ONE must survive (Phase 2). Never resurrect the other.
- `app/(public)/page.tsx.backup`-style backup files are forbidden — git is the backup.
- Vercel serverless: request bodies cap at 4.5MB → all file uploads go browser→R2 via presigned URLs, never through an API route body.
- Guest users: name in localStorage only, zero API calls, cannot download.
