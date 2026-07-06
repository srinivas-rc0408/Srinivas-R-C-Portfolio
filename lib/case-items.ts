import type { LucideIcon } from "lucide-react";
import {
  FileText,
  ScrollText,
  Bot,
  Rocket,
  Sparkles,
  GraduationCap,
  Briefcase,
  Trophy,
  Award,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CS2-STYLE RARITY SYSTEM
   Items = portfolio sections. Weighted random pick, CS2-tier colors.
   ═══════════════════════════════════════════════════════════════ */

export type RarityId = "gold" | "red" | "pink" | "purple" | "blue";

export interface RarityConfig {
  id: RarityId;
  label: string;
  color: string;
  particleCount: number;
  edgeFlashes: number;
  shake: boolean;
  goldDelay: boolean;
}

export const RARITIES: Record<RarityId, RarityConfig> = {
  gold: { id: "gold", label: "Exceedingly Rare", color: "#FFD700", particleCount: 300, edgeFlashes: 3, shake: true, goldDelay: true },
  red: { id: "red", label: "Covert", color: "#EB4B4B", particleCount: 150, edgeFlashes: 2, shake: true, goldDelay: false },
  pink: { id: "pink", label: "Classified", color: "#D32CE6", particleCount: 80, edgeFlashes: 1, shake: false, goldDelay: false },
  purple: { id: "purple", label: "Restricted", color: "#8847FF", particleCount: 80, edgeFlashes: 1, shake: false, goldDelay: false },
  blue: { id: "blue", label: "Mil-Spec", color: "#4B69FF", particleCount: 30, edgeFlashes: 0, shake: false, goldDelay: false },
};

export interface CaseItem {
  id: string;
  label: string;
  rarity: RarityId;
  weight: number;
  icon: LucideIcon;
  /** "resume" | "cv" open the DocumentModal; anything else is a router.push target. */
  route: string;
}

const STATIC_ITEMS: CaseItem[] = [
  { id: "resume", label: "Resume", rarity: "gold", weight: 3, icon: FileText, route: "resume" },
  { id: "cv", label: "CV", rarity: "red", weight: 7, icon: ScrollText, route: "cv" },
  { id: "education", label: "Education", rarity: "blue", weight: 13.5, icon: GraduationCap, route: "/details#education" },
  { id: "experience", label: "Experience", rarity: "blue", weight: 13.5, icon: Briefcase, route: "/details#experience" },
  { id: "achievements", label: "Achievements", rarity: "blue", weight: 13.5, icon: Trophy, route: "/details#achievements" },
  { id: "certifications", label: "Certifications", rarity: "blue", weight: 13.5, icon: Award, route: "/details#certifications" },
];

export interface ProjectSummary {
  slug: string;
  title: string;
}

/**
 * First project (by sortOrder, i.e. projects[0]) is the PINK "ArchAgent" slot
 * until real project content replaces the placeholders — repoint by reordering
 * projects in the admin panel, no code change needed.
 */
export function buildCaseItems(projects: ProjectSummary[]): CaseItem[] {
  const [archAgent, ...rest] = projects;
  const items = [...STATIC_ITEMS];
  if (archAgent) {
    items.push({ id: archAgent.slug, label: archAgent.title, rarity: "pink", weight: 12, icon: Bot, route: `/projects/${archAgent.slug}` });
  }
  rest.slice(0, 3).forEach((p, i) => {
    const icon = i === 0 ? Rocket : i === 1 ? Sparkles : FileText;
    items.push({ id: p.slug, label: p.title, rarity: "purple", weight: 8, icon, route: `/projects/${p.slug}` });
  });
  return items;
}

export function pickWeighted(items: CaseItem[]): CaseItem {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}
