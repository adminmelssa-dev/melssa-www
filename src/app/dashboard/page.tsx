import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { KpiRow } from "@/components/dashboard/overview/kpi-row";
import { ActivityFeed } from "@/components/dashboard/overview/activity-feed";
import { QuickActions } from "@/components/dashboard/overview/quick-actions";
import { PendingConcerns } from "@/components/dashboard/overview/pending-concerns";
import { AnnouncementsTable } from "@/components/dashboard/overview/announcements-table";
import { requireAuth } from "@/server/auth/guards";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const firstName = session.user.name.split(" ")[0] || session.user.name;
  const now = new Date();

  return (
    <div className="mx-auto max-w-6xl space-y-9">
      <DashboardPageHeader
        kicker={dateFormatter.format(now)}
        title={`${greetingFor(now.getHours())}, ${firstName}.`}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/dashboard/resources">
                <Upload className="size-4" />
                Upload
              </Link>
            </Button>
            <Button asChild variant="gold" size="sm" className="rounded-full">
              <Link href="/dashboard/announcements">
                <Plus className="size-4" />
                New announcement
              </Link>
            </Button>
          </>
        }
      />

      <KpiRow />

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <ActivityFeed />
        <div className="space-y-10">
          <QuickActions />
          <PendingConcerns />
        </div>
      </div>

      <AnnouncementsTable />
    </div>
  );
}
