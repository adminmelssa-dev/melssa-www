import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Globe2,
  MessageSquareText,
  Plus,
  Upload,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { KpiRow } from "@/components/dashboard/overview/kpi-row";
import { ActivityFeed } from "@/components/dashboard/overview/activity-feed";
import { QuickActions } from "@/components/dashboard/overview/quick-actions";
import { PendingConcerns } from "@/components/dashboard/overview/pending-concerns";
import { AnnouncementsTable } from "@/components/dashboard/overview/announcements-table";
import { ROLES, resolveUserRole } from "@/modules/auth/roles";
import { hasPermission, requireAuth } from "@/server/auth/guards";
import {
  formatRelativeTime,
  type ActivityEntry,
  type KpiStat,
  type OverviewAnnouncement,
  type PendingConcern,
} from "@/components/dashboard/overview/overview-data";
import { getSerializedResources } from "@/modules/resources/queries";
import { getSerializedEvents } from "@/modules/events/queries";
import {
  getSerializedAnnouncements,
} from "@/modules/announcements/queries";
import { ANNOUNCEMENT_CATEGORY_LABELS } from "@/modules/announcements/contracts";
import { getSerializedConcerns } from "@/modules/concerns/queries";
import {
  CONCERN_CATEGORY_LABELS,
  type ConcernRow,
} from "@/modules/concerns/contracts";
import { getSerializedAuditLogs } from "@/modules/audit/queries";
import type { AuditLogRow } from "@/modules/audit/contracts";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function entityLabel(entityType: string): string {
  const label = entityType.replace(/[_-]/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const firstName = session.user.name.split(" ")[0] || session.user.name;
  const role = resolveUserRole(session.user.role);
  const now = new Date();

  if (role === ROLES.STUDENT || role === null) {
    return <StudentDashboard firstName={firstName} now={now} />;
  }

  const canReadConcerns = hasPermission(role, {
    resource: "concern",
    action: "read",
  });
  const canReadAudit = hasPermission(role, { resource: "audit", action: "read" });

  const [resourceRows, eventRows, announcementRows, concernRows, auditRows] =
    await Promise.all([
      getSerializedResources(),
      getSerializedEvents(),
      getSerializedAnnouncements(),
      canReadConcerns
        ? getSerializedConcerns()
        : Promise.resolve<ConcernRow[]>([]),
      canReadAudit ? getSerializedAuditLogs() : Promise.resolve<AuditLogRow[]>([]),
    ]);

  const upcomingEvents = eventRows.filter(
    (event) => new Date(event.startsAt).getTime() >= now.getTime(),
  );
  const openConcerns = concernRows.filter(
    (concern) => concern.status !== "resolved",
  );

  const kpis: KpiStat[] = [
    {
      label: "Total resources",
      value: String(resourceRows.length),
      tone: "neutral",
    },
    {
      label: "Announcements",
      value: String(announcementRows.length),
      tone: "neutral",
    },
    {
      label: "Upcoming events",
      value: String(upcomingEvents.length),
      tone: "neutral",
    },
    {
      label: "Open concerns",
      value: String(openConcerns.length),
      tone: openConcerns.length > 0 ? "warn" : "neutral",
    },
  ];

  const activity: ActivityEntry[] = auditRows.slice(0, 5).map((log, index) => ({
    id: `${log.createdAt}-${index}`,
    subject: log.actor?.name ?? "System",
    detail: log.summary,
    meta: entityLabel(log.entityType),
    time: formatRelativeTime(log.createdAt),
    tone: /resolve|archive|delete/i.test(log.action) ? "success" : "gold",
  }));

  const pending: PendingConcern[] = openConcerns.slice(0, 4).map((concern) => ({
    id: String(concern.id),
    title: concern.subject,
    meta: `${CONCERN_CATEGORY_LABELS[concern.category]} · ${formatRelativeTime(concern.createdAt)} ago`,
  }));

  const announcementViews: OverviewAnnouncement[] = announcementRows
    .slice(0, 5)
    .map((row) => ({
      id: String(row.id),
      title: row.title,
      category: ANNOUNCEMENT_CATEGORY_LABELS[row.category],
      status: row.status,
      author: row.author?.name ?? "—",
      published: row.publishedAt
        ? shortDateFormatter.format(new Date(row.publishedAt))
        : "—",
    }));

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

      <KpiRow stats={kpis} />

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <ActivityFeed entries={activity} />
        <div className="space-y-10">
          <QuickActions />
          <PendingConcerns concerns={pending} />
        </div>
      </div>

      <AnnouncementsTable rows={announcementViews} />
    </div>
  );
}

function StudentDashboard({
  firstName,
  now,
}: {
  firstName: string;
  now: Date;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <DashboardPageHeader
        kicker={dateFormatter.format(now)}
        title={`Welcome, ${firstName}.`}
        description="Your MELSSA workspace is set up for resources, support, and account access."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StudentActionCard
          description="Browse published slides, past questions, and course materials."
          href="/dashboard/resources"
          icon={FileText}
          title="Resources"
        />
        <StudentActionCard
          description="Send a private concern without attaching your portal identity."
          href="/dashboard/concerns"
          icon={MessageSquareText}
          title="Submit concern"
        />
        <StudentActionCard
          description="Manage your account, password, sessions, and passkeys."
          href="/dashboard/profile"
          icon={UserCircle}
          title="Profile"
        />
        <StudentActionCard
          description="Return to public announcements, events, gallery, and spotlight."
          href="/"
          icon={Globe2}
          title="Public portal"
        />
      </section>
    </div>
  );
}

function StudentActionCard({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: typeof FileText;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </span>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={href}>
            Open
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
