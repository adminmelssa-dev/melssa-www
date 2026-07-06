import {
  CalendarDays,
  CircleOff,
  Images,
  Send,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventsTable } from "@/modules/events/components/events-table";
import type { EventRow } from "@/modules/events/contracts";
import { getSerializedEvents } from "@/modules/events/queries";
import { hasPermission, requirePermission } from "@/server/auth/guards";

interface EventsAdminStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  cancelledEvents: number;
}

export async function EventsAdminPage() {
  const session = await requirePermission({ resource: "event", action: "read" });
  const events = await getSerializedEvents();
  const stats = getEventsAdminStats(events);
  const permissions = {
    canCreate: hasPermission(session.user.role, {
      resource: "event",
      action: "create",
    }),
    canUpdate: hasPermission(session.user.role, {
      resource: "event",
      action: "update",
    }),
    canDelete: hasPermission(session.user.role, {
      resource: "event",
      action: "delete",
    }),
    canPublish: hasPermission(session.user.role, {
      resource: "event",
      action: "publish",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Programs and activities</p>
        <h1 className="font-heading text-2xl font-black">Events</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Events" value={stats.totalEvents} />
        <StatCard icon={Send} label="Published" value={stats.publishedEvents} />
        <StatCard icon={Images} label="Drafts" value={stats.draftEvents} />
        <StatCard
          icon={CircleOff}
          label="Cancelled"
          value={stats.cancelledEvents}
        />
      </section>

      <EventsTable initialEvents={events} permissions={permissions} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CalendarDays;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <CardTitle className="text-2xl font-black">{value}</CardTitle>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardHeader>
    </Card>
  );
}

function getEventsAdminStats(events: EventRow[]): EventsAdminStats {
  return {
    totalEvents: events.length,
    publishedEvents: events.filter((event) => event.status === "published")
      .length,
    draftEvents: events.filter((event) => event.status === "draft").length,
    cancelledEvents: events.filter((event) => event.status === "cancelled")
      .length,
  };
}
