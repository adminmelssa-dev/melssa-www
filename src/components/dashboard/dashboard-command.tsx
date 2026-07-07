"use client";

import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getDashboardNavGroups } from "@/components/dashboard/nav-config";
import type { UserRole } from "@/modules/auth/roles";

interface DashboardCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionKeys: string[];
  role: UserRole | null;
}

/** ⌘K palette for jumping between dashboard sections. */
export function DashboardCommand({
  open,
  onOpenChange,
  permissionKeys,
  role,
}: DashboardCommandProps) {
  const router = useRouter();
  const groups = getDashboardNavGroups(role, permissionKeys);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Dashboard search"
      description="Jump to a section"
    >
      <Command>
        <CommandInput placeholder="Jump to a section…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${group.label} ${item.title}`}
                  onSelect={() => go(item.href)}
                >
                  <item.icon className="size-4" />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
