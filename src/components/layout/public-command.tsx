"use client";

import { useRouter } from "next/navigation";
import {
  Award,
  BadgeDollarSign,
  Bell,
  CalendarDays,
  FileText,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface PublicCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface JumpItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const sections: JumpItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Announcements", href: "/announcements", icon: Bell },
  { label: "Resources", href: "/resources", icon: FileText },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Lecturers", href: "/lecturers", icon: Users },
  { label: "Concerns", href: "/concerns", icon: MessageSquareText },
  { label: "Gallery", href: "/gallery", icon: ImageIcon },
  { label: "Student Spotlight", href: "/spotlight", icon: Sparkles },
  { label: "Finance", href: "/finance", icon: FileText },
  { label: "Fundraising", href: "/fundraising", icon: BadgeDollarSign },
  { label: "Scholarships", href: "/scholarships", icon: Award },
];

const more: JumpItem[] = [
  { label: "Manifesto — Kirstin Ankrah", href: "/manifesto", icon: ScrollText },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

/** ⌘K palette for jumping around the public site. */
export function PublicCommand({ open, onOpenChange }: PublicCommandProps) {
  const router = useRouter();

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search MELSSA"
      description="Jump to a section"
    >
      <Command>
        <CommandInput placeholder="Search the portal…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Sections">
            {sections.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => go(item.href)}
              >
                <item.icon className="size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="More">
            {more.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => go(item.href)}
              >
                <item.icon className="size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
