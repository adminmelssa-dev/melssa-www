"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MobileNavGroups } from "@/components/layout/nav-links";

/** Slide-in primary navigation for small screens. */
export function MobileNav() {
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
        <SheetHeader className="px-5">
          <SheetTitle className="font-heading text-xl tracking-[0.06em]">
            MELSSA
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-2 flex-1 overflow-y-auto border-t border-hairline px-3 py-3">
          <MobileNavGroups onClose={() => setOpen(false)} />
        </nav>
        <div className="border-t border-hairline px-5 py-5">
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
