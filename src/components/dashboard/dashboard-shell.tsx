"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { DashboardCommand } from "@/components/dashboard/dashboard-command";
import type { UserRole } from "@/modules/auth/roles";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  role: UserRole | null;
  userName: string;
  userEmail: string;
  children: ReactNode;
}

/** Dashboard chrome: collapsible desktop sidebar, mobile sheet, topbar, ⌘K palette. */
export function DashboardShell({
  role,
  userName,
  userEmail,
  children,
}: DashboardShellProps) {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-hairline bg-paper-2 transition-[width] duration-300 ease-editorial lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <DashboardSidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          collapsed={collapsed}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-paper-2 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <DashboardSidebar
            role={role}
            userName={userName}
            userEmail={userEmail}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          onToggleCollapse={toggleCollapsed}
          onOpenMobile={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>

      <DashboardCommand
        open={searchOpen}
        onOpenChange={setSearchOpen}
        role={role}
      />
    </div>
  );
}
