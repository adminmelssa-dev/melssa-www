import {
  Bell,
  CalendarPlus,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { StatTone } from "@/components/dashboard/stat-tile";

/**
 * Placeholder overview content. Presentational only — replaced by the relevant
 * module queries (resources / announcements / events / concerns) once wired.
 */

export interface KpiStat {
  label: string;
  value: string;
  delta: string;
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
  title: string;
  meta: string;
}

export interface AnnouncementRow {
  title: string;
  category: string;
  status: "published" | "draft" | "scheduled";
  author: string;
  published: string;
}

export const kpiStats: KpiStat[] = [
  { label: "Total resources", value: "325", delta: "+18 this week", tone: "up" },
  { label: "Announcements", value: "42", delta: "+6 this week", tone: "up" },
  { label: "Scheduled events", value: "12", delta: "+3 this week", tone: "up" },
  { label: "Open concerns", value: "4", delta: "2 awaiting reply", tone: "warn" },
];

export const activityEntries: ActivityEntry[] = [
  {
    id: "a1",
    subject: "Dr. Kwabena Osei",
    detail: "uploaded Clinical Chemistry — Enzymes",
    meta: "Level 300 · Semester 1",
    time: "12m",
    tone: "gold",
  },
  {
    id: "a2",
    subject: "Exams Committee",
    detail: "published the Semester 2 timetable",
    meta: "Announcement · Academics",
    time: "2h",
    tone: "gold",
  },
  {
    id: "a3",
    subject: "New event",
    detail: "scheduled — Community Health Screening",
    meta: "18 July · Main Campus",
    time: "5h",
    tone: "gold",
  },
  {
    id: "a4",
    subject: "Concern #0231",
    detail: "was marked resolved by Welfare",
    meta: "Resolved in 6 hours",
    time: "1d",
    tone: "success",
  },
  {
    id: "a5",
    subject: "Ama Serwaa",
    detail: "was added to Student Spotlight",
    meta: "Leadership Award, 2026",
    time: "1d",
    tone: "gold",
  },
];

export const quickActions: QuickAction[] = [
  { label: "Post an announcement", href: "/dashboard/announcements", icon: Bell },
  { label: "Upload lecture slides", href: "/dashboard/resources", icon: Upload },
  { label: "Create an event", href: "/dashboard/events", icon: CalendarPlus },
  { label: "Add a lecturer", href: "/dashboard/lecturers", icon: UserPlus },
];

export const pendingConcerns: PendingConcern[] = [
  { title: "Lab session scheduling clash", meta: "Academics · 3h ago" },
  { title: "Request for more past questions", meta: "Resources · 1d ago" },
  { title: "Feedback on congress venue", meta: "Events · 2d ago" },
];

export const announcementRows: AnnouncementRow[] = [
  {
    title: "Semester 2 exam timetable",
    category: "Academics",
    status: "published",
    author: "Exams Committee",
    published: "6 Jul 2026",
  },
  {
    title: "Lab coat & ID distribution",
    category: "Notice",
    status: "published",
    author: "PRO's Office",
    published: "4 Jul 2026",
  },
  {
    title: "Join the MELSSA Media Hub",
    category: "Opportunity",
    status: "draft",
    author: "Kirstin Ankrah",
    published: "—",
  },
  {
    title: "Congress — call for volunteers",
    category: "Events",
    status: "scheduled",
    author: "Organising Team",
    published: "20 Jul 2026",
  },
];
