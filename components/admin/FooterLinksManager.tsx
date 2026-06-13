"use client";

import { useState, useEffect } from "react";
import { getFooterLinks, createFooterLink, updateFooterLink, deleteFooterLink } from "@/app/actions/footer";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X, Link as LinkIcon, Eye, EyeOff, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface FooterLink {
  id: string;
  platform: string;
  url: string;
  iconName: string;
  isActive: boolean;
  order: number;
}

const COMMON_ICONS = ["Github", "Linkedin", "Twitter", "Mail", "Phone", "Globe", "Instagram", "Youtube"];

export default function FooterLinksManager() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({ platform: "", url: "", iconName: "Globe" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    const data = await getFooterLinks();
    setLinks(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newLink.platform || !newLink.url) {
      toast.error("Platform and URL are required");
      return;
    }
    setSaving(true);
    const res = await createFooterLink(newLink);
    if (res.success) {
      toast.success("Link added successfully");
      setIsAdding(false);
      setNewLink({ platform: "", url: "", iconName: "Globe" });
      loadLinks();
    } else {
      toast.error(res.error || "Failed to add link");
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const res = await updateFooterLink(id, { isActive: !current });
    if (res.success) {
      toast.success(current ? "Link hidden" : "Link visible");
      setLinks(links.map(l => l.id === id ? { ...l, isActive: !current } : l));
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    const res = await deleteFooterLink(id);
    if (res.success) {
      toast.success("Link deleted");
      setLinks(links.filter(l => l.id !== id));
    } else {
      toast.error("Failed to delete link");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-space font-bold text-white">Footer Links</h2>
          <p className="text-sm text-text-muted mt-1">Manage the dynamic links appearing in the global footer.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-colors font-medium text-sm"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Add Link"}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs text-white/50 mb-1 block">Platform Label</label>
            <input
              type="text"
              value={newLink.platform}
              onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
              placeholder="e.g. LinkedIn"
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs text-white/50 mb-1 block">URL</label>
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-xs text-white/50 mb-1 block">Lucide Icon</label>
            <select
              value={newLink.iconName}
              onChange={(e) => setNewLink({ ...newLink, iconName: e.target.value })}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            >
              {COMMON_ICONS.map(icon => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 h-[38px] flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save
          </button>
        </div>
      )}

      <div className="space-y-3">
        {links.length === 0 && !isAdding && (
          <div className="text-center py-8 text-white/30 text-sm">
            No footer links configured.
          </div>
        )}
        
        {links.map((link) => {
          const Icon = (LucideIcons as any)[link.iconName] || LinkIcon;
          return (
            <div key={link.id} className={`flex items-center justify-between p-4 rounded-xl border border-white/[0.05] transition-colors ${link.isActive ? 'bg-white/[0.01]' : 'bg-white/[0.01] opacity-50'}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/70">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-white/90 text-sm">{link.platform}</h3>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline truncate max-w-[200px] md:max-w-[400px] block">
                    {link.url}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(link.id, link.isActive)}
                  className="p-2 text-white/40 hover:text-white/90 transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                  title={link.isActive ? "Hide link" : "Show link"}
                >
                  {link.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="p-2 text-red-400/60 hover:text-red-400 transition-colors bg-red-400/5 hover:bg-red-400/10 rounded-lg"
                  title="Delete link"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
