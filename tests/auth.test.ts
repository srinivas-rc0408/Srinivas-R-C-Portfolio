import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db.ts";
import { createUserToken, verifyToken } from "../lib/auth.ts";
import { checkLoginRateLimit } from "../lib/rateLimit.ts";
import { registerUser } from "../app/api/auth/user/register/route.ts";
import { loginUser } from "../app/api/auth/user/login/route.ts";
import { resolveMeStatus } from "../app/api/auth/user/me/route.ts";

const email = "test-visitor@example.dev";

async function cleanup() {
  await prisma.session.deleteMany({ where: { user: { email } } });
  await prisma.user.deleteMany({ where: { email } });
}

beforeEach(cleanup);
after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("registerUser rejects a password under 8 characters", async () => {
  const result = await registerUser({ name: "Test Visitor", email, password: "short" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 400);
});

test("registerUser creates a hashed-password User and a valid token, no Session row", async () => {
  const result = await registerUser({ name: "Test Visitor", email, password: "password123" });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const stored = await prisma.user.findUnique({ where: { email } });
  assert.ok(stored);
  assert.ok(stored.passwordHash);
  assert.ok(await bcrypt.compare("password123", stored.passwordHash!));
  assert.equal(stored.role, "user");

  const payload = await verifyToken(result.token);
  assert.equal(payload?.role, "user");
  assert.equal(payload?.email, email);
  assert.equal(payload?.sub, stored.id);

  const sessions = await prisma.session.findMany({ where: { userId: stored.id } });
  assert.equal(sessions.length, 0);
});

test("registerUser rejects a duplicate email with 409", async () => {
  await registerUser({ name: "Test Visitor", email, password: "password123" });
  const result = await registerUser({ name: "Someone Else", email, password: "password123" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 409);
});

test("loginUser rejects an unknown email with 401", async () => {
  const result = await loginUser({ email: "no-such-user@example.dev", password: "password123" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 401);
});

test("loginUser rejects the wrong password with 401", async () => {
  await registerUser({ name: "Test Visitor", email, password: "password123" });
  const result = await loginUser({ email, password: "wrong-password" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 401);
});

test("loginUser succeeds with correct credentials and creates a Session row", async () => {
  await registerUser({ name: "Test Visitor", email, password: "password123" });
  const result = await loginUser({ email, password: "password123" });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const session = await prisma.session.findUnique({ where: { token: result.token } });
  assert.ok(session);
  assert.equal(session?.userId, result.user.id);
});

test("resolveMeStatus reports guest for a missing or invalid token", async () => {
  assert.deepEqual(await resolveMeStatus(undefined), { status: "guest" });
  assert.deepEqual(await resolveMeStatus("not-a-real-token"), { status: "guest" });
});

test("resolveMeStatus reports user for a valid visitor token", async () => {
  const token = await createUserToken({ id: "u1", email, name: "Test Visitor" });
  const status = await resolveMeStatus(token);
  assert.equal(status.status, "user");
  assert.equal(status.email, email);
  assert.equal(status.name, "Test Visitor");
});

test("checkLoginRateLimit fails open when Upstash isn't configured", async () => {
  assert.equal(await checkLoginRateLimit("203.0.113.1"), true);
});
