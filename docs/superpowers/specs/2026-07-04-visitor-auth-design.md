# Visitor Auth — Design

**Date:** 2026-07-04
**Status:** Approved, ready for implementation plan
**Roadmap:** Pulls Phase 7 ("Visitor auth: guest vs registered") forward, ahead of Phases 2–6. Admin login (existing) is untouched.

## Context

The site currently has exactly one auth flow: admin login, reachable two ways —
a dedicated `/admin` page, and the public Navbar "Sign In" button (whose modal
is currently admin-only, mislabeled "ACCESS ADMIN_OS — Authorized personnel
only"). There is no way for a regular site visitor to create an account or
log in. The `User` and `Session` Prisma models already exist (added in
Phase 1) but are unused by any route.

Owner decision: keep both admin entry points working as today, and make the
public "Sign In" button also serve visitors — one form, server decides who
you are.

## Architecture

Two independent auth mechanisms, sharing one form:

- **Admin** (unchanged): credentials checked against `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` env vars → `jose` JWT → `srinivas_admin_session` cookie,
  24h expiry. Lives in `lib/auth.ts`, gates `/admin/dashboard/*` via
  `middleware.ts`.
- **Visitor** (new): DB-backed via the existing `User` + `Session` Prisma
  models.
  - **Guest**: name typed into the modal, saved to `localStorage` only.
    Zero network calls. No account, no session, cannot download (existing
    CLAUDE.md rule, unchanged).
  - **Registered**: email + password (+ optional name, phone) →
    `bcryptjs` hash (cost 12) → `User` row. Session is an opaque
    `crypto.randomUUID()` token stored in the `Session` table (`token`,
    `expiresAt`), not a JWT — the table exists for exactly this, and it
    makes logout a real DB delete instead of waiting out a token's expiry.
    Cookie: `srinivas_user_session`, httpOnly, `secure` in production,
    `sameSite: lax`, 30-day `maxAge`.

Login is a single endpoint: try the admin env-var check first (existing
behavior, untouched); if it doesn't match, fall through to a `User` lookup +
bcrypt compare. The client never has to know in advance which kind of
account it's submitting.

## API surface

### `POST /api/auth` (extended)
Body: `{ email, password }`.
1. If `email`/`password` match `ADMIN_EMAIL`/`ADMIN_PASSWORD` → existing
   admin flow, unchanged, returns `{ success: true, role: "admin" }`.
2. Else, `prisma.user.findUnique({ where: { email } })`. If found and
   `bcrypt.compare(password, user.passwordHash)` succeeds → create a
   `Session` row (`token` = `crypto.randomUUID()`, `expiresAt` = now + 30d),
   set `srinivas_user_session` cookie, return
   `{ success: true, role: "user", name: user.name }`.
3. Else → `401 { error: "Invalid email or password." }` (same message for
   "wrong password" and "no such user" — no user enumeration).

### `POST /api/auth/register` (new)
Body: `{ name, email, password, phone? }`.
- `400` if `name`, `email`, or `password` missing, or `password.length < 8`.
- `409` if `email` already exists in `User`.
- Else: `bcrypt.hash(password, 12)` → `prisma.user.create(...)` → create a
  `Session` row + set the cookie exactly as the login success path (auto
  sign-in after registering) → `{ success: true, name }`.

### `GET /api/auth/me` (new)
Reads `srinivas_user_session` cookie → `prisma.session.findUnique({ where:
{ token }, include: { user: true } })`.
- No cookie, no matching `Session`, or `session.expiresAt < now` → `401`.
  If the row exists but is expired, delete it before responding (lazy
  cleanup, no cron job).
- Else → `{ name: session.user.name }`.

### `POST /api/auth/logout` (extended)
- If an admin cookie is present, clear it (existing behavior).
- If a `srinivas_user_session` cookie is present, `prisma.session.delete`
  the matching row (ignore not-found) and clear the cookie.

## Frontend

- **`SignInModal.tsx`**: three modes — Guest / Sign In / Create Account,
  switched by local state, same glassmorphic visual language (no redesign).
  Copy changes from admin-only wording to neutral, public-facing text. A
  successful admin login still redirects to `/admin/dashboard`; a
  successful visitor login/register just closes the modal.
- **`AuthStatus` (new, small component)**: replaces the static "Sign In"
  button in `Navbar.tsx`. Uses SWR to `GET /api/auth/me` on mount; shows
  the visitor's name + a logout action when logged in, otherwise today's
  "Sign In" button that opens `SignInModal`. Keeps `Navbar.tsx` itself from
  growing a second responsibility.
- `/admin` page and `/admin/dashboard` — untouched.

## Error handling

- Register: `400` (missing fields / short password), `409` (email taken).
- Login: `401` generic message for any failure (wrong password or unknown
  email indistinguishable to the client).
- `/me`: `401` treated as "logged out" client-side, not surfaced as an
  error banner.
- Network/unexpected errors: `500` with a generic message, matching the
  existing `/api/auth` pattern.

## Testing

Per this session's TDD directive (API/Prisma layer only, no tests for
modal/Navbar UI): `node:test` coverage, reusing the `tests/` +
`resolve-next.mjs` infra from Phase 1.

- `register`: creates a `User` with a hashed (not plaintext) password;
  rejects duplicate email; rejects short password; auto-creates a session.
- `auth` (login): admin path still succeeds (regression); visitor login
  succeeds and creates a `Session` row; wrong password and unknown email
  both return the same 401.
- `me`: valid session → name; missing/invalid/expired session → 401;
  expired session row gets deleted on read.
- `logout`: deletes the `Session` row; clears the cookie.

## Out of scope (explicitly, per roadmap)

- OAuth (`googleId`/`githubId` fields stay unused).
- Gated downloads / `DownloadLog` wiring — Phase 8.
- Any visible guest-name display in the Navbar beyond `localStorage` —
  not requested, guest stays exactly as CLAUDE.md's existing rule describes.
