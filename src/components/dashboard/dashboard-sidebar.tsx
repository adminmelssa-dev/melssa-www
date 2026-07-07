"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Atom } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu } from "@/components/dashboard/user-menu";
import {
  getDashboardNavGroups,
  type DashboardNavItem,
} from "@/components/dashboard/nav-config";
import type { UserRole } from "@/modules/auth/roles";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  permissionKeys: string[];
  role: UserRole | null;
  userName: string;
  userEmail: string;
  collapsed?: boolean;
  /** Called on nav click — used to close the mobile sheet. */
  onNavigate?: () => void;
}

function isActive(href: string, pathname: string): boolean {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
}

export function DashboardSidebar({
  permissionKeys,
  role,
  userName,
  userEmail,
  collapsed = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const groups = getDashboardNavGroups(role, permissionKeys);

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-[70px] items-center border-b border-hairline",
          collapsed ? "justify-center px-0" : "gap-3 px-5",
        )}
      >
        <Link
          href="/dashboard"
          className="relative grid size-9 shrink-0 place-items-center rounded-full border border-gold/70"
          aria-label="MELSSA dashboard"
        >
          <span
            aria-hidden
            className="absolute inset-[3px] rounded-full border border-border"
          />
          <Atom className="relative size-[20px] text-gold-ink" />
        </Link>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-heading text-lg tracking-[0.06em] text-foreground">
              MELSSA
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-ink">
              Workspace
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            {collapsed ? (
              <div className="mx-3 mb-2 h-px bg-hairline first:hidden" />
            ) : (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/40">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href, pathname)}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-hairline p-3">
        <UserMenu
          userName={userName}
          userEmail={userEmail}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: DashboardNavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center rounded-md text-sm transition-colors",
        collapsed ? "mx-auto size-10 justify-center" : "gap-3 px-3 py-2",
        active
          ? "font-medium text-foreground"
          : "text-foreground/60 hover:bg-paper-3 hover:text-foreground",
        active && collapsed && "bg-paper-3 text-gold-ink",
      )}
    >
      {active && !collapsed && (
        <span
          aria-hidden
          className="absolute -left-3 top-1/2 h-[18px] w-0.5 -translate-y-1/2 rounded-full bg-gold"
        />
      )}
      <item.icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}
