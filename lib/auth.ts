import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════
   AUTH UTILITIES
   Shared between API routes and middleware.
   ═══════════════════════════════════════════════════════════════ */

const COOKIE_NAME = "srinivas_admin_session";
const TOKEN_EXPIRY = "24h";

const USER_COOKIE_NAME = "srinivas_user_session";
const USER_TOKEN_EXPIRY = "30d";
const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return new TextEncoder().encode(secret);
}

/** Sign a JWT with the admin email as the subject */
export async function createToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setSubject(email)
    .sign(getSecret());
}

/** Verify a JWT token (admin or visitor), returns the payload or null */
export async function verifyToken(
  token: string
): Promise<{ email: string; role: string; name?: string; sub?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { email: string; role: string; name?: string; sub?: string };
  } catch {
    return null;
  }
}

/** Set the session cookie */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/** Get the session cookie value */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/** Clear the session cookie */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/* ═══════════════════════════════════════════════════════════════
   VISITOR AUTH — separate cookie/JWT from the admin session above.
   ═══════════════════════════════════════════════════════════════ */

/** Sign a 30-day JWT for a registered visitor */
export async function createUserToken(user: { id: string; email: string; name: string }): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(USER_TOKEN_EXPIRY)
    .setSubject(user.id)
    .sign(getSecret());
}

export async function setUserSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: USER_COOKIE_MAX_AGE,
  });
}

export async function getUserSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(USER_COOKIE_NAME)?.value;
}

export async function clearUserSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}

/** Validate credentials against env vars */
export function validateCredentials(
  email: string,
  password: string
): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL or ADMIN_PASSWORD not configured in .env.local");
    return false;
  }

  return email === adminEmail && password === adminPassword;
}

/** Check an API request's session cookie for an admin role. Used by admin-only routes. */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === "admin";
}

/** Helper: create a JSON error response */
export function authError(message: string, status: number = 401) {
  return NextResponse.json({ error: message }, { status });
}

export { COOKIE_NAME, USER_COOKIE_NAME };
