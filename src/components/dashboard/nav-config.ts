import {
  Bell,
  CalendarDays,
  FileText,
  GalleryHorizontal,
  GraduationCap,
  HardDrive,
  History,
  Home,
  MessageSquareText,
  Microscope,
  Settings,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLES, type UserRole } from "@/modules/auth/roles";

export interface DashboardNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface DashboardNavGroup {
  label: string;
  items: DashboardNavItem[];
}

const generalNav: DashboardNavItem[] = [
  { title: "Overview", href: "/dashboard", icon: Home },
  { title: "Profile", href: "/dashboard/profile", icon: UserCircle },
  { title: "Resources", href: "/dashboard/resources", icon: FileText },
  { title: "Concerns", href: "/dashboard/concerns", icon: MessageSquareText },
];

const contentNav: DashboardNavItem[] = [
  { title: "Announcements", href: "/dashboard/announcements", icon: Bell },
  { title: "Events", href: "/dashboard/events", icon: CalendarDays },
  { title: "Courses", href: "/dashboard/courses", icon: GraduationCap },
  { title: "Lecturers", href: "/dashboard/lecturers", icon: Users },
  { title: "Gallery", href: "/dashboard/gallery", icon: GalleryHorizontal },
  { title: "Spotlight", href: "/dashboard/spotlight", icon: Sparkles },
];

const adminNav: DashboardNavItem[] = [
  { title: "Users", href: "/dashboard/users", icon: Users },
  { title: "Audit log", href: "/dashboard/audit-log", icon: History },
  { title: "Storage", href: "/dashboard/storage", icon: HardDrive },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function getDashboardNavGroups(role: UserRole | null): DashboardNavGroup[] {
  const groups: DashboardNavGroup[] = [
    { label: "General", items: generalNav },
  ];

  if (role === ROLES.CONTENT_ADMIN || role === ROLES.SITE_ADMIN) {
    groups.push({ label: "Content", items: contentNav });
  }

  if (role === ROLES.SITE_ADMIN) {
    groups.push({ label: "Administration", items: adminNav });
  }

  return groups;
}

export const dashboardBrand = {
  title: "MELSSA",
  subtitle: "Student Portal",
  icon: Microscope,
};
