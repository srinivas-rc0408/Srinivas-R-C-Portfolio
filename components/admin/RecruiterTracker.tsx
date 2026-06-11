import { Users, Building, HardDrive, Clock } from "lucide-react";

export default function RecruiterTracker({ downloads }: { downloads: any[] }) {
  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Users className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="font-space text-xl font-bold text-white">Recruiter Intelligence</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="pb-3 px-4 font-medium text-text-muted">Timestamp</th>
              <th className="pb-3 px-4 font-medium text-text-muted">User / Email</th>
              <th className="pb-3 px-4 font-medium text-text-muted">Estimated Company/ISP</th>
              <th className="pb-3 px-4 font-medium text-text-muted">File Downloaded</th>
            </tr>
          </thead>
          <tbody>
            {downloads.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted">
                  No downloads recorded yet.
                </td>
              </tr>
            ) : (
              downloads.map((dl) => (
                <tr key={dl.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 text-sm text-text-muted">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(dl.downloadedAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-white text-sm font-medium">{dl.user?.name || "Anonymous"}</p>
                    <p className="text-text-muted text-xs">{dl.user?.email || "Unknown"}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Building size={14} className="text-indigo-400" />
                      <span className="text-sm text-white">{dl.estimatedCompany || dl.ipAddress || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <HardDrive size={14} className="text-accent" />
                      <span className="text-sm font-mono text-accent bg-accent/10 px-2 py-1 rounded-md">
                        {dl.fileName}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
