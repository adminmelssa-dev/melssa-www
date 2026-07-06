"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  FileText,
  FolderOpen,
  Home,
  Image as ImageIcon,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface NavLeaf {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavLeaf[];
  featured?: NavLeaf;
}

const navGroups: NavGroup[] = [
  {
    title: "Academics",
    items: [
      {
        title: "Resources",
        href: "/resources",
        description: "Lecture slides & past questions, by course",
        icon: FileText,
      },
      {
        title: "Lecturers",
        href: "/lecturers",
        description: "Contacts, courses taught & office hours",
        icon: Users,
      },
    ],
    featured: {
      title: "The resource archive",
      description:
        "Slides, past questions and reference materials, organised by level and semester.",
      href: "/resources",
      icon: FolderOpen,
    },
  },
  {
    title: "Community",
    items: [
      {
        title: "Announcements",
        href: "/announcements",
        description: "Association updates & the Weekly Bulletin",
        icon: Bell,
      },
      {
        title: "Events",
        href: "/events",
        description: "Congress, outreach, seminars & screenings",
        icon: CalendarDays,
      },
      {
        title: "Gallery",
        href: "/gallery",
        description: "Photos from MELSSA events",
        icon: ImageIcon,
      },
      {
        title: "Spotlight",
        href: "/spotlight",
        description: "Celebrating our members",
        icon: Sparkles,
      },
    ],
  },
];

const mobileDirectIcons: Record<string, LucideIcon> = {
  "/": Home,
  "/concerns": MessageSquareText,
};

function isActive(href: string, pathname: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => isActive(item.href, pathname));
}

const triggerBase =
  "h-9 rounded-md bg-transparent px-3 text-[13.5px] font-medium transition-colors hover:bg-paper-3 hover:text-foreground focus:bg-paper-3 data-[state=open]:bg-paper-3 data-[state=open]:text-foreground";

/* ---------------- Desktop ---------------- */

function LeafItem({ item, pathname }: { item: NavLeaf; pathname: string }) {
  return (
    <li>
      <NavigationMenuLink asChild active={isActive(item.href, pathname)}>
        <Link
          href={item.href}
          className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-paper-3 data-[active=true]:bg-paper-3"
        >
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-gold-soft text-gold-ink">
            <item.icon className="size-4" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[13.5px] font-medium leading-none text-foreground">
              {item.title}
            </span>
            <span className="text-[12px] leading-snug text-foreground/55">
              {item.description}
            </span>
          </span>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

function FeaturedCard({ featured }: { featured: NavLeaf }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={featured.href}
        className="flex h-full flex-col rounded-md bg-navy-deep p-4 text-cream transition-colors hover:bg-navy"
      >
        <span className="grid size-9 place-items-center rounded-md bg-cream/12 text-gold-bright">
          <featured.icon className="size-4.5" />
        </span>
        <span className="mt-auto pt-6 font-heading text-[17px] leading-tight">
          {featured.title}
        </span>
        <span className="mt-1.5 text-[12px] leading-snug text-cream/70">
          {featured.description}
        </span>
        <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-gold-bright">
          Browse
          <ArrowRight className="size-3.5" />
        </span>
      </Link>
    </NavigationMenuLink>
  );
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <NavigationMenu viewport={false} className="hidden lg:flex" aria-label="Main">
      <NavigationMenuList className="gap-0.5">
        <NavigationMenuItem>
          <NavigationMenuLink asChild active={isActive("/", pathname)}>
            <Link
              href="/"
              className={cn(
                triggerBase,
                "flex items-center",
                isActive("/", pathname)
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              Home
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {navGroups.map((group) => (
          <NavigationMenuItem key={group.title}>
            <NavigationMenuTrigger
              className={cn(
                triggerBase,
                isGroupActive(group, pathname)
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              {group.title}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="rounded-md border border-hairline bg-paper-2 p-2 shadow-lg">
              {group.featured ? (
                <div className="grid w-[36rem] grid-cols-[0.8fr_1fr] gap-2">
                  <FeaturedCard featured={group.featured} />
                  <ul className="grid content-start gap-0.5">
                    {group.items.map((item) => (
                      <LeafItem key={item.href} item={item} pathname={pathname} />
                    ))}
                  </ul>
                </div>
              ) : (
                <ul className="grid w-[22rem] gap-0.5">
                  {group.items.map((item) => (
                    <LeafItem key={item.href} item={item} pathname={pathname} />
                  ))}
                </ul>
              )}
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}

        <NavigationMenuItem>
          <NavigationMenuLink asChild active={isActive("/concerns", pathname)}>
            <Link
              href="/concerns"
              className={cn(
                triggerBase,
                "flex items-center",
                isActive("/concerns", pathname)
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              Concerns
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/* ---------------- Mobile ---------------- */

function MobileLink({
  href,
  title,
  icon: Icon,
  pathname,
  onClose,
}: {
  href: string;
  title: string;
  icon: LucideIcon;
  pathname: string;
  onClose: () => void;
}) {
  const active = isActive(href, pathname);
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
        active
          ? "text-gold-ink"
          : "text-foreground/70 hover:bg-paper-3 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0 text-foreground/45" />
      {title}
    </Link>
  );
}

export function MobileNavGroups({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const activeGroup = navGroups.find((group) =>
    isGroupActive(group, pathname),
  )?.title;

  return (
    <div className="flex flex-col">
      <MobileLink
        href="/"
        title="Home"
        icon={Home}
        pathname={pathname}
        onClose={onClose}
      />
      <Accordion
        type="multiple"
        defaultValue={activeGroup ? [activeGroup] : []}
      >
        {navGroups.map((group) => (
          <AccordionItem
            key={group.title}
            value={group.title}
            className="border-none"
          >
            <AccordionTrigger className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-paper-3 hover:no-underline">
              {group.title}
            </AccordionTrigger>
            <AccordionContent className="pb-1 pl-3">
              {group.featured ? (
                <MobileLink
                  href={group.featured.href}
                  title={group.featured.title}
                  icon={group.featured.icon}
                  pathname={pathname}
                  onClose={onClose}
                />
              ) : null}
              {group.items.map((item) => (
                <MobileLink
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                  pathname={pathname}
                  onClose={onClose}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <MobileLink
        href="/concerns"
        title="Concerns"
        icon={mobileDirectIcons["/concerns"] ?? MessageSquareText}
        pathname={pathname}
        onClose={onClose}
      />
    </div>
  );
}
