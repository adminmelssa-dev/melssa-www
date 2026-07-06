"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNavItemActive, publicNavItems } from "@/components/layout/nav-items";

/** Slide-in primary navigation for small screens. */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(20rem,85vw)] gap-0 px-0">
        <SheetHeader className="px-6">
          <SheetTitle className="font-heading text-xl tracking-[0.06em]">
            MELSSA
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-2 flex flex-col border-t border-hairline">
          {publicNavItems.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b border-hairline px-6 py-4 font-heading text-lg transition-colors",
                  active
                    ? "text-gold-ink"
                    : "text-foreground hover:text-gold-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-6">
          <Button asChild variant="gold" className="w-full rounded-full">
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <LayoutDashboard className="size-4" />
              Enter dashboard
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
