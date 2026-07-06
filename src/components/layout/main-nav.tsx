"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavItemActive, publicNavItems } from "@/components/layout/nav-items";

/** Desktop primary nav with an animated gold underline on the active/hovered item. */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-7 lg:flex">
      {publicNavItems.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative py-1.5 text-[13.5px] transition-colors",
              active
                ? "font-medium text-foreground"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            {item.label}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 h-px origin-left bg-gold transition-transform duration-300 ease-editorial",
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
