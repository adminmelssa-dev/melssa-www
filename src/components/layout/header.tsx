"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MelssaWordmark } from "@/components/brand/melssa-wordmark";
import { DesktopNav } from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PublicCommand } from "@/components/layout/public-command";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-hairline bg-background/85 backdrop-blur-sm transition-[height,box-shadow] duration-300",
          scrolled ? "h-16 shadow-sm" : "h-[74px]",
        )}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-gold"
        />
        <div className="mx-auto flex h-full max-w-6xl items-center gap-8 px-7">
          <MelssaWordmark />
          <DesktopNav />

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-hairline bg-paper-2 px-3.5 py-2 text-[13px] text-foreground/50 transition-colors hover:border-foreground/25 hover:text-foreground sm:flex"
            >
              <Search className="size-3.5" />
              Search
              <kbd className="ml-1 rounded border border-hairline bg-background px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>
            <Button asChild variant="gold" size="sm" className="rounded-full px-4">
              <Link href="/dashboard">Enter dashboard</Link>
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>

      <PublicCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
