import { redirect } from "next/navigation";
import { getSessionCookie, verifyToken } from "@/lib/auth";

/* Server-side guard: no valid admin session → back to the login page. */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionCookie();
  const payload = token ? await verifyToken(token) : null;
  if (payload?.role !== "admin") redirect("/");
  return children;
}
