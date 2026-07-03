"use client";

import { AdminProvider, useAdminStore } from "@/src/contexts/AdminStore";
import AdminLayout from "@/src/components/admin/AdminLayout";
import ProjectsWorkspace from "@/src/components/admin/ProjectsWorkspace";
import TextWorkspace from "@/src/components/admin/TextWorkspace";
import SocialLinksEditor from "@/src/components/admin/SocialLinksEditor";

/* ═══════════════════════════════════════════════════════════════
   ADMIN_OS DASHBOARD (MASTER ROUTE)
   The central integration point. Wraps the dashboard in the
   AdminProvider and switches the active workspace dynamically.
   ═══════════════════════════════════════════════════════════════ */

function DashboardContent() {
  const { activeTab } = useAdminStore();

  return (
    <AdminLayout>
      {activeTab === "Projects" && <ProjectsWorkspace />}
      {(activeTab === "Education" || 
        activeTab === "Experience" || 
        activeTab === "Achievements" || 
        activeTab === "Certificates" || 
        activeTab === "Resume" || 
        activeTab === "CV") && (
        <TextWorkspace sectionTitle={activeTab} />
      )}
      {activeTab === "Socials & Footer" && <SocialLinksEditor />}
    </AdminLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminProvider>
      <DashboardContent />
    </AdminProvider>
  );
}
