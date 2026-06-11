import { getSiteConfig } from "@/lib/config";
import { AlertTriangle } from "lucide-react";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig();

  if (config.maintenanceMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-8">
          <AlertTriangle className="w-10 h-10 text-orange-400" />
        </div>
        <h1 className="font-space text-4xl font-bold text-white mb-4">Under Maintenance</h1>
        <p className="text-text-muted text-lg max-w-md">
          The site is currently undergoing scheduled maintenance. Please check back later.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
