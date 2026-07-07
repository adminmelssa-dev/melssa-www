import {
  // Award,
  BadgeDollarSign,
  Bell,
  BookOpenText,
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
import type { UserRole } from "@/modules/auth/roles";

export interface DashboardNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermissionKey?: string;
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
  {
    title: "Announcements",
    href: "/dashboard/announcements",
    icon: Bell,
    requiredPermissionKey: "announcement.read",
  },
  {
    title: "Bulletins",
    href: "/dashboard/bulletins",
    icon: BookOpenText,
    requiredPermissionKey: "bulletin.read",
  },
  {
    title: "Events",
    href: "/dashboard/events",
    icon: CalendarDays,
    requiredPermissionKey: "event.read",
  },
  {
    title: "Courses",
    href: "/dashboard/courses",
    icon: GraduationCap,
    requiredPermissionKey: "course.read",
  },
  {
    title: "Lecturers",
    href: "/dashboard/lecturers",
    icon: Users,
    requiredPermissionKey: "lecturer.read",
  },
  {
    title: "Gallery",
    href: "/dashboard/gallery",
    icon: GalleryHorizontal,
    requiredPermissionKey: "gallery.read",
  },
  {
    title: "Spotlight",
    href: "/dashboard/spotlight",
    icon: Sparkles,
    requiredPermissionKey: "spotlight.read",
  },
];

const financeNav: DashboardNavItem[] = [
  {
    title: "Finance",
    href: "/dashboard/finance",
    icon: FileText,
    requiredPermissionKey: "finance.read",
  },
  {
    title: "Fundraising",
    href: "/dashboard/fundraising",
    icon: BadgeDollarSign,
    requiredPermissionKey: "fundraising.read",
  },
  // Scholarship workspace is built but hidden until MELSSA asks for it.
  // {
  //   title: "Scholarships",
  //   href: "/dashboard/scholarships",
  //   icon: Award,
  //   requiredPermissionKey: "scholarship.read",
  // },
];

const adminNav: DashboardNavItem[] = [
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    requiredPermissionKey: "user.list",
  },
  {
    title: "Audit log",
    href: "/dashboard/audit-log",
    icon: History,
    requiredPermissionKey: "audit.read",
  },
  {
    title: "Storage",
    href: "/dashboard/storage",
    icon: HardDrive,
    requiredPermissionKey: "storage.audit",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiredPermissionKey: "settings.read",
  },
];

export function getDashboardNavGroups(
  role: UserRole | null,
  permissionKeys: string[] = [],
): DashboardNavGroup[] {
  const permissionKeySet = new Set(permissionKeys);
  const groups: DashboardNavGroup[] = [
    { label: "General", items: generalNav },
  ];
  const visibleContentItems = getVisibleItems(contentNav, permissionKeySet);
  const visibleFinanceItems = getVisibleItems(financeNav, permissionKeySet);
  const visibleAdminItems = getVisibleItems(adminNav, permissionKeySet);

  if (role !== null && visibleContentItems.length > 0) {
    groups.push({ label: "Content", items: visibleContentItems });
  }

  if (role !== null && visibleFinanceItems.length > 0) {
    groups.push({ label: "Finance Desk", items: visibleFinanceItems });
  }

  if (role !== null && visibleAdminItems.length > 0) {
    groups.push({ label: "Administration", items: visibleAdminItems });
  }

  return groups;
}

function getVisibleItems(
  items: DashboardNavItem[],
  permissionKeys: Set<string>,
): DashboardNavItem[] {
  return items.filter(
    (item) =>
      item.requiredPermissionKey === undefined ||
      permissionKeys.has(item.requiredPermissionKey),
  );
}

export const dashboardBrand = {
  title: "MELSSA",
  subtitle: "Student Portal",
  icon: Microscope,
};
