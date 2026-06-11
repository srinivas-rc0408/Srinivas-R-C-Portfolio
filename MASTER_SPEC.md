# MASTER SPECIFICATION: Project Kinetic
**Lead Engineer:** Srinivas R C (B.Tech CSE AIML, REVA University 2027)
**Project:** Gamified Full-Stack Personal Portfolio

## 1. Core Architecture & Tech Stack
- **Framework:** Next.js 14 (App Router). Use Server Components by default; `"use client"` only when necessary.
- **Styling:** Tailwind CSS + Framer Motion.
- **Database & ORM:** PostgreSQL via Prisma.
- **Auth:** NextAuth.js v5 (Credentials, Google, GitHub).
- **Caching & Rate Limiting:** Upstash Redis.
- **Storage:** Cloudflare R2 (S3 API).
- **PDF Engine:** `pdf-lib` + `sharp` (Runs server-side).
- **Game Engine:** Phaser 3 (2D Driving) & Three.js/tsparticles (Backgrounds).

## 2. Strict AI Engineering Rules (CRITICAL)
1. **Three.js Memory Leaks:** Every Three.js component MUST clean up on unmount. You must call `geometry.dispose()`, `material.dispose()`, and `renderer.dispose()`.
2. **Phaser 3 SSR Crash:** Phaser uses `window`. You MUST load the `GameCanvas` component using `dynamic(() => import('...'), { ssr: false })`.
3. **Security:** NEVER hardcode passwords, JWT secrets, or API keys. Use `process.env`.
4. **Rate Limiting:** Protect `/api/auth/register` and `/api/download` using Upstash Redis.
5. **Animation Physics:** For the CS2 Gamble reel, use `requestAnimationFrame` with an easeOutExpo deceleration curve ($t=1-pow(2,-10*t)$). Do NOT use `setInterval`.

## 3. Design System Tokens (Dark Mode Strict)
- **Primary Background:** Deep Navy (`#0F0F1A` / `bg-[#0F0F1A]`)
- **Card Surfaces:** Dark Surface (`#1A1A2E`)
- **Primary Accent:** Electric Violet (`#6C63FF`) - Use for CTAs, active states, hover borders.
- **Secondary Accent:** Coral Pink (`#FF6584`) - Use for Gamble highlight, errors.
- **Text:** Near White (`#E8E8FF`) for primary, Muted Lavender (`#8888BB`) for secondary.
- **Typography:** `Space Grotesk` (Headings/Display), `Inter` (Body), `JetBrains Mono` (Code/Tags).
- **Components:** Glassmorphism is heavily encouraged (`bg-opacity`, `backdrop-blur`). Massive negative space. No crowded grids.

## 4. Prisma Database Schema
You must implement this exact schema:

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  user
  admin
}

model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  phone         String?
  passwordHash  String?
  googleId      String?   @unique
  githubId      String?   @unique
  role          Role      @default(user)
  createdAt     DateTime  @default(now())
  downloads     DownloadLog[]
  views         ViewLog[]
  gameSessions  GameSession[]
}

model DownloadLog {
  id           String   @id @default(uuid())
  userId       String?
  section      String
  fileName     String
  downloadedAt DateTime @default(now())
  ipAddress    String?
  user         User?    @relation(fields: [userId], references: [id])
}

model ViewLog {
  id              String   @id @default(uuid())
  userId          String?
  guestName       String?
  section         String
  viewedAt        DateTime @default(now())
  durationSeconds Int?
  user            User?    @relation(fields: [userId], references: [id])
}

model GameSession {
  id               String   @id @default(uuid())
  userId           String?
  vehicleType      String
  distanceTraveled Float    @default(0)
  stopsVisited     String[]
  durationSeconds  Int?
  playedAt         DateTime @default(now())
  user             User?    @relation(fields: [userId], references: [id])
}
