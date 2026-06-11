import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-8">
        <ShieldX className="w-10 h-10 text-red-400" />
      </div>
      <h1 className="font-space text-5xl font-bold text-white mb-4">403</h1>
      <h2 className="font-space text-2xl font-bold text-white mb-4">Access Denied</h2>
      <p className="text-text-muted text-lg max-w-md mb-10">
        You don&apos;t have permission to access this page. This area is restricted to administrators only.
      </p>
      <Link
        href="/"
        className="px-8 py-3 rounded-full bg-accent hover:bg-accent/80 text-white font-medium transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
