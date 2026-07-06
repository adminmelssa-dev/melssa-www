"use client";

import { usePathname } from "next/navigation";
import { Menu, PanelLeft, Search } from "lucide-react";
import { DashboardNotificationBell } from "@/components/dashboard/dashboard-notification-bell";
import type { DashboardNotificationsResponse } from "@/modules/notifications/contracts";

interface DashboardTopbarProps {
  initialNotifications: DashboardNotificationsResponse;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
  onOpenSearch: () => void;
}

function crumbFromPath(pathname: string): string {
  const segment = pathname.replace(/\/+$/, "").split("/").pop() ?? "";
  if (!segment || segment === "dashboard") return "Overview";
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const iconButton =
  "grid size-9 place-items-center rounded-md text-foreground/55 transition-colors hover:bg-paper-3 hover:text-foreground";

export function DashboardTopbar({
  initialNotifications,
  onToggleCollapse,
  onOpenMobile,
  onOpenSearch,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const crumb = crumbFromPath(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-[70px] items-center gap-2 border-b border-hairline bg-background/85 px-4 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open menu"
        className={`${iconButton} lg:hidden`}
      >
        <Menu className="size-5" />
      </button>
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label="Toggle sidebar"
        className={`hidden ${iconButton} lg:grid`}
      >
        <PanelLeft className="size-5" />
      </button>

      <nav
        aria-label="Breadcrumb"
        className="ml-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/45"
      >
        <span className="hidden sm:inline">Dashboard</span>
        <span aria-hidden className="hidden sm:inline">
          /
        </span>
        <span className="text-foreground">{crumb}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden items-center gap-2 rounded-md border border-hairline bg-paper-2 px-3 py-1.5 text-[13px] text-foreground/50 transition-colors hover:border-foreground/25 hover:text-foreground sm:flex"
        >
          <Search className="size-3.5" />
          Search
          <kbd className="ml-2 rounded border border-hairline bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        <DashboardNotificationBell initialNotifications={initialNotifications} />
      </div>
    </header>
  );
}
