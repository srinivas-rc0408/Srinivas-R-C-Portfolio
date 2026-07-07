import { redirect } from "next/navigation";
import { getSessionCookie, verifyToken } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   /admin — the separate admin gateway is gone. The owner signs in
   through the normal Sign In modal (admin credentials are detected
   there). This route just forwards: valid admin session → dashboard,
   otherwise → home.
   ═══════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = await getSessionCookie();
  const payload = token ? await verifyToken(token) : null;
  redirect(payload?.role === "admin" ? "/admin/dashboard" : "/");
}
