import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { quickActions } from "@/components/dashboard/overview/overview-data";

export function QuickActions() {
  return (
    <section>
      <h2 className="text-2xl">Quick actions</h2>
      <div className="mt-5 border-t border-hairline">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3.5 border-b border-hairline py-3.5 transition-[padding] duration-300 ease-editorial hover:pl-2"
          >
            <action.icon className="size-[18px] text-gold-ink" />
            <span className="text-sm font-medium text-foreground">
              {action.label}
            </span>
            <ArrowRight className="ml-auto size-4 text-foreground/35 transition-transform duration-300 ease-editorial group-hover:translate-x-1 group-hover:text-gold-ink" />
          </Link>
        ))}
      </div>
    </section>
  );
}
