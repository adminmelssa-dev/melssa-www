"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  dashboardNotificationsResponseSchema,
  type DashboardNotificationMutation,
  type DashboardNotificationRow,
  type DashboardNotificationsResponse,
} from "@/modules/notifications/contracts";
import { actionResultSchema } from "@/lib/action-result";
import { cn } from "@/lib/utils";

const dashboardNotificationsQueryKey = ["dashboard-notifications"];

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

interface DashboardNotificationBellProps {
  initialNotifications: DashboardNotificationsResponse;
}

const iconButton =
  "relative grid size-9 place-items-center rounded-md text-foreground/55 transition-colors hover:bg-paper-3 hover:text-foreground";

export function DashboardNotificationBell({
  initialNotifications,
}: DashboardNotificationBellProps) {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: dashboardNotificationsQueryKey,
    queryFn: fetchDashboardNotifications,
    initialData: initialNotifications,
    refetchInterval: 60_000,
  });
  const mutation = useMutation({
    mutationFn: patchDashboardNotification,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: dashboardNotificationsQueryKey,
      });
    },
  });
  const unreadCount = notificationsQuery.data.unreadCount;

  function markRead(notificationId: number): void {
    mutation.mutate({ type: "read", notificationId });
  }

  function markAllRead(): void {
    mutation.mutate({ type: "read-all" });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Notifications" className={iconButton}>
          <Bell className="size-[18px]" />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <PopoverHeader className="border-b border-hairline px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <PopoverTitle>Notifications</PopoverTitle>
            {unreadCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={mutation.isPending}
                onClick={markAllRead}
              >
                Mark all read
              </Button>
            ) : null}
          </div>
        </PopoverHeader>
        <div className="max-h-96 overflow-y-auto p-2">
          {notificationsQuery.data.notifications.length > 0 ? (
            notificationsQuery.data.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markRead}
              />
            ))
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
              <Bell className="size-7 text-muted-foreground/35" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="max-w-52 text-xs text-muted-foreground">
                Operational updates will appear here.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: DashboardNotificationRow;
  onRead: (notificationId: number) => void;
}) {
  const isUnread = notification.readAt === null;
  const content = (
    <div
      className={cn(
        "rounded-md px-3 py-2.5 text-left transition-colors",
        notification.href ? "hover:bg-paper-3" : "",
        isUnread ? "bg-secondary/45" : "",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            isUnread ? "bg-gold" : "bg-border",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-medium">
            {notification.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {notification.body}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/75">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );

  if (!notification.href) {
    return (
      <button
        type="button"
        className="block w-full"
        onClick={() => {
          if (isUnread) onRead(notification.id);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={notification.href}
      className="block"
      onClick={() => {
        if (isUnread) onRead(notification.id);
      }}
    >
      {content}
    </Link>
  );
}

async function fetchDashboardNotifications(): Promise<
  DashboardNotificationsResponse
> {
  const response = await fetch("/api/notifications", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load notifications.",
    );
  }

  return dashboardNotificationsResponseSchema.parse(body);
}

async function patchDashboardNotification(
  mutation: DashboardNotificationMutation,
) {
  const response = await fetch("/api/notifications", {
    body: JSON.stringify(mutation),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  return relativeTimeFormatter.format(Math.round(diffHours / 24), "day");
}
