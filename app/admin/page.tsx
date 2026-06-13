import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Users, Gamepad2, Settings, LogOut, FileText, UploadCloud } from "lucide-react";
import DashboardCharts from "@/components/admin/DashboardCharts";
import UserAuditTable from "@/components/admin/UserAuditTable";
import GameLeaderboard from "@/components/admin/GameLeaderboard";
import ContentEditor from "@/components/admin/ContentEditor";
import FileUploadHub from "@/components/admin/FileUploadHub";
import SystemHealth from "@/components/admin/SystemHealth";
import ModuleToggles from "@/components/admin/ModuleToggles";
import ActivityFeed from "@/components/admin/ActivityFeed";
import PerformanceCharts from "@/components/admin/PerformanceCharts";
import RecruiterTracker from "@/components/admin/RecruiterTracker";
import FeedbackInbox from "@/components/admin/FeedbackInbox";
import FooterLinksManager from "@/components/admin/FooterLinksManager";
import { Briefcase, MessageSquare, Link as LinkIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }

  // Log admin dashboard view
  try {
    await prisma.adminLog.create({
      data: {
        action: "Viewed Admin Dashboard",
        targetUserId: session.user.id,
      }
    });
  } catch {
    // DB might not be up
  }

  const activeTab = searchParams.tab || "overview";

  // Data fetching logic only for overview tab to save DB hits
  let users: any[] = [];
  let viewLogs: any[] = [];
  let gameSessions: any[] = [];

  if (activeTab === "overview" || activeTab === "users" || activeTab === "games") {
    const getCachedUsers = unstable_cache(
      async () => prisma.user.findMany({
        include: { downloads: true },
        orderBy: { createdAt: "desc" }
      }),
      ['admin-users'],
      { revalidate: 60, tags: ['admin'] }
    );

    const getCachedViewLogs = unstable_cache(
      async () => prisma.viewLog.groupBy({
        by: ["section"],
        _count: { section: true }
      }),
      ['admin-views'],
      { revalidate: 60, tags: ['admin'] }
    );

    const getCachedGameSessions = unstable_cache(
      async () => prisma.gameSession.findMany({
        include: { user: true },
        orderBy: { playedAt: "desc" }
      }),
      ['admin-games'],
      { revalidate: 60, tags: ['admin'] }
    );

    try {
      [users, viewLogs, gameSessions] = await Promise.all([
        getCachedUsers(),
        getCachedViewLogs(),
        getCachedGameSessions()
      ]);
    } catch {
      // Graceful fallback if DB is down
    }
  }

  let downloads: any[] = [];
  if (activeTab === "recruiter") {
    try {
      downloads = await prisma.downloadLog.findMany({
        include: { user: true },
        orderBy: { downloadedAt: "desc" },
      });
    } catch {
      // DB down
    }
  }

  const viewData = viewLogs.map(log => ({
    name: log.section,
    views: log._count.section
  }));

  const vehicleCounts = gameSessions.reduce((acc, session) => {
    acc[session.vehicleType] = (acc[session.vehicleType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gameData = Object.keys(vehicleCounts).map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    sessions: vehicleCounts[type]
  }));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-space font-bold text-xl text-white">Admin Panel</h2>
          <p className="text-xs text-text-muted mt-1">{session.user.email}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin?tab=overview" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'overview' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard size={20} /> Overview
          </Link>
          <Link href="/admin?tab=content" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'content' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
            <FileText size={20} /> Content Editor
          </Link>
          <Link href="/admin?tab=upload" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'upload' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
            <UploadCloud size={20} /> File Uploads
          </Link>
          <Link href="/admin?tab=recruiter" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'recruiter' ? 'bg-indigo-500/10 text-indigo-400' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
            <Briefcase size={20} /> Recruiter Intel
          </Link>
          <Link href="/admin?tab=users" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
            <Users size={20} /> Users & Logs
          </Link>
          <Link href="/admin?tab=feedback" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'feedback' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
            <MessageSquare size={20} /> Feedback Inbox
          </Link>
          <Link href="/admin?tab=footer" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'footer' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
            <LinkIcon size={20} /> Footer Links
          </Link>
          <Link href="/admin?tab=settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
            <Settings size={20} /> Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-text-muted hover:text-white transition-colors">
            <ArrowLeft size={20} /> Back to Site
          </Link>
          <Link href="/api/auth/signout" className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors mt-2">
            <LogOut size={20} /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <h1 className="font-space text-3xl font-bold text-white mb-2">
              {activeTab === 'overview' && "Dashboard Overview"}
              {activeTab === 'content' && "Content Management"}
              {activeTab === 'upload' && "File Hub"}
              {activeTab === 'recruiter' && "Recruiter Intelligence"}
              {activeTab === 'users' && "User Audit"}
              {activeTab === 'feedback' && "Feedback Inbox"}
              {activeTab === 'footer' && "Footer Links"}
              {activeTab === 'settings' && "System Settings"}
            </h1>
            <p className="text-text-muted">Welcome back, {session.user.name}.</p>
          </header>

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-surface border border-white/5 p-6 rounded-2xl shadow-xl">
                  <div className="text-text-muted text-sm font-medium mb-2">Total Users</div>
                  <div className="font-space text-3xl font-bold text-white">{users.length}</div>
                </div>
                <div className="bg-surface border border-white/5 p-6 rounded-2xl shadow-xl">
                  <div className="text-text-muted text-sm font-medium mb-2">Game Sessions</div>
                  <div className="font-space text-3xl font-bold text-white">{gameSessions.length}</div>
                </div>
                <div className="bg-surface border border-white/5 p-6 rounded-2xl shadow-xl">
                  <div className="text-text-muted text-sm font-medium mb-2">Downloads</div>
                  <div className="font-space text-3xl font-bold text-white">
                    {users.reduce((acc, user) => acc + (user.downloads?.length || 0), 0)}
                  </div>
                </div>
                <div className="bg-surface border border-white/5 p-6 rounded-2xl shadow-xl">
                  <div className="text-text-muted text-sm font-medium mb-2">Page Views</div>
                  <div className="font-space text-3xl font-bold text-white">
                    {viewLogs.reduce((acc, log) => acc + log._count.section, 0)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-12">
                <div className="xl:col-span-2 flex flex-col gap-6">
                  <SystemHealth />
                  <PerformanceCharts />
                  <DashboardCharts viewData={viewData} gameData={gameData} />
                </div>
                <div className="xl:col-span-1">
                  <ActivityFeed />
                </div>
              </div>
            </>
          )}

          {activeTab === 'recruiter' && (
            <RecruiterTracker downloads={downloads} />
          )}

          {activeTab === 'content' && (
            <ContentEditor />
          )}

          {activeTab === 'upload' && (
            <FileUploadHub />
          )}

          {activeTab === 'users' && (
            <>
              <UserAuditTable users={users} />
              <div className="mt-12">
                <GameLeaderboard sessions={gameSessions} />
              </div>
            </>
          )}

          {activeTab === 'feedback' && (
            <FeedbackInbox />
          )}

          {activeTab === 'footer' && (
            <FooterLinksManager />
          )}

          {activeTab === 'settings' && (
            <ModuleToggles />
          )}
        </div>
      </main>
    </div>
  );
}
