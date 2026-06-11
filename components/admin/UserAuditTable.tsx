"use client";

import { DownloadLog } from "@prisma/client";

interface UserWithStats {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  downloads: DownloadLog[];
}

interface UserAuditTableProps {
  users: UserWithStats[];
}

export default function UserAuditTable({ users }: UserAuditTableProps) {
  return (
    <div className="bg-surface border border-white/5 rounded-2xl shadow-xl overflow-hidden mb-12">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-space text-xl font-bold text-white">User Audit</h3>
        <p className="text-text-muted text-sm mt-1">Registered users and their activity.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-text-muted text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium">Total Downloads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                  No registered users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-xs text-text-muted font-mono">{user.id.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-accent/20 text-accent font-medium text-xs">
                      {user.downloads.length} files
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
