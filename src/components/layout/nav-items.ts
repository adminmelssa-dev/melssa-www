export interface NavItem {
  href: string;
  label: string;
}

/** Primary public navigation, shared by the desktop and mobile menus. */
export const publicNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/announcements", label: "Announcements" },
  { href: "/resources", label: "Resources" },
  { href: "/events", label: "Events" },
  { href: "/lecturers", label: "Lecturers" },
  { href: "/concerns", label: "Concerns" },
];

/** Whether a nav item is active for the current pathname. */
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
