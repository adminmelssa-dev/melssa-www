import {
  Bell,
  CalendarPlus,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { StatTone } from "@/components/dashboard/stat-tile";
import type { ContentStatus } from "@/modules/content/contracts";

export interface KpiStat {
  label: string;
  value: string;
  delta?: string;
  tone: StatTone;
}

export interface ActivityEntry {
  id: string;
  subject: string;
  detail: string;
  meta: string;
  time: string;
  tone: "gold" | "success";
}

export interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface PendingConcern {
  id: string;
  title: string;
  meta: string;
}

export interface OverviewAnnouncement {
  id: string;
  title: string;
  category: string;
  status: ContentStatus;
  author: string;
  published: string;
}

/** Static navigation shortcuts — not data, so these stay hard-coded. */
export const quickActions: QuickAction[] = [
  { label: "Post an announcement", href: "/dashboard/announcements", icon: Bell },
  { label: "Upload lecture slides", href: "/dashboard/resources", icon: Upload },
  { label: "Create an event", href: "/dashboard/events", icon: CalendarPlus },
  { label: "Add a lecturer", href: "/dashboard/lecturers", icon: UserPlus },
];

/** Compact relative time, e.g. "12m", "3h", "2d", "1w". */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
