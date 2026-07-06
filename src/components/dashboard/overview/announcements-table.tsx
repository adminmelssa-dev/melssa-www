import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  announcementRows,
  type AnnouncementRow,
} from "@/components/dashboard/overview/overview-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<AnnouncementRow["status"], { dot: string; label: string }> =
  {
    published: { dot: "bg-success", label: "text-success" },
    draft: { dot: "bg-gold", label: "text-gold-ink" },
    scheduled: { dot: "bg-foreground/40", label: "text-foreground/50" },
  };

const columns = ["Title", "Category", "Status", "Author", "Published", ""];

export function AnnouncementsTable() {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">Manage announcements</h2>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/dashboard/announcements">
            <Plus className="size-4" />
            New
          </Link>
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-foreground/80">
              {columns.map((column, index) => (
                <th
                  key={column || index}
                  className="pb-3 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-foreground/45"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {announcementRows.map((row) => {
              const status = statusStyles[row.status];
              return (
                <tr
                  key={row.title}
                  className="border-b border-hairline transition-colors hover:bg-paper-2"
                >
                  <td className="py-4 pr-4">
                    <span className="font-heading text-[17px]">{row.title}</span>
                  </td>
                  <td className="py-4 pr-4 text-[11px] uppercase tracking-[0.1em] text-foreground/55">
                    {row.category}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]",
                        status.label,
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", status.dot)} />
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-sm text-foreground/70">
                    {row.author}
                  </td>
                  <td className="py-4 pr-4 text-sm text-foreground/70">
                    {row.published}
                  </td>
                  <td className="py-4 text-right">
                    <Link
                      href="/dashboard/announcements"
                      aria-label={`Open ${row.title}`}
                      className="inline-flex text-foreground/40 transition-colors hover:text-gold-ink"
                    >
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
