"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronsUpDown,
  Home,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { useMounted } from "@/lib/use-mounted";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/modules/auth/client";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  userName: string;
  userEmail: string;
  collapsed?: boolean;
}

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

/** Sidebar account button — opens a menu with theme controls and sign out. */
export function UserMenu({ userName, userEmail, collapsed = false }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const result = await authClient.signOut();

    if (result.error) {
      toast.error(result.error.message ?? "Sign out failed.");
      setSigningOut(false);
      return;
    }

    router.push("/sign-in?force=true");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center rounded-lg text-left transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          collapsed ? "justify-center p-1.5" : "gap-3 p-2",
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-xs font-semibold text-cream">
          {getInitials(userName)}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-foreground">
                {userName}
              </span>
              <span className="block truncate text-[11.5px] text-foreground/55">
                {userEmail}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-foreground/40" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-[13px] font-medium">{userName}</div>
          <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-1.5 py-1.5">
          <p className="px-1.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-1 rounded-md bg-paper-3 p-1">
            {themeOptions.map((option) => {
              const active = mounted && theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded px-1.5 py-1.5 text-[11.5px] font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-foreground/55 hover:text-foreground",
                  )}
                >
                  <option.icon className="size-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <Settings className="size-4" />
            Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/">
            <Home className="size-4" />
            Back to portal
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          variant="destructive"
        >
          <LogOut className="size-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
