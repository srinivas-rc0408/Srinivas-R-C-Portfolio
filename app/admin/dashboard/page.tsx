"use client";

import { AdminProvider, useAdminStore } from "@/src/contexts/AdminStore";
import AdminLayout from "@/src/components/admin/AdminLayout";
import ProjectsWorkspace from "@/src/components/admin/ProjectsWorkspace";
import TextWorkspace from "@/src/components/admin/TextWorkspace";
import SocialLinksEditor from "@/src/components/admin/SocialLinksEditor";
import DocumentWorkspace from "@/src/components/admin/DocumentWorkspace";
import CertificatesWorkspace from "@/src/components/admin/CertificatesWorkspace";
import RecruiterTracker from "@/src/components/admin/RecruiterTracker";
import FeedbackInbox from "@/src/components/admin/FeedbackInbox";

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
      {(activeTab === "Education" || activeTab === "Experience" || activeTab === "Achievements") && (
        <TextWorkspace sectionTitle={activeTab} />
      )}
      {activeTab === "Resume" && <DocumentWorkspace type="resume" />}
      {activeTab === "CV" && <DocumentWorkspace type="cv" />}
      {activeTab === "Certificates" && <CertificatesWorkspace />}
      {activeTab === "Socials & Footer" && <SocialLinksEditor />}
      {activeTab === "Downloads" && <RecruiterTracker />}
      {activeTab === "Feedback" && <FeedbackInbox />}
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
