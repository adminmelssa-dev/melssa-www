"use client";

import * as React from "react";
import {
  CalendarDays,
  CircleOff,
  Edit3,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useServerDataTable } from "@/components/data-table/use-server-data-table";
import { StorageUploadField } from "@/components/storage/upload-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_OPTIONS,
  adminEventsResponseSchema,
  createEventInputSchema,
  eventStatusSchema,
  type CreateEventInput,
  type EventRow,
  type EventStatus,
  type UpdateEventInput,
} from "@/modules/events/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { DataTablePageMeta } from "@/lib/data-table-query";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminEventsQueryKey = ["admin-events"];

const posterFilterOptions = [
  { label: "Has poster", value: "has_poster" },
  { label: "No poster", value: "no_poster" },
];

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

interface EventFormValues {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  status: EventStatus;
  poster: UploadedStorageObject | null;
}

interface EventsTableProps {
  initialEvents: EventRow[];
  initialMeta: DataTablePageMeta;
  permissions: EventTablePermissions;
}

interface EventTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export function EventsTable({
  initialEvents,
  initialMeta,
  permissions,
}: EventsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<EventRow | null>(null);
  const [deletingEvent, setDeletingEvent] = React.useState<EventRow | null>(
    null,
  );
  const queryClient = useQueryClient();
  const serverTable = useServerDataTable();
  const setPageMeta = serverTable.setPageMeta;

  const eventsQuery = useQuery({
    queryKey: [...adminEventsQueryKey, serverTable.queryKey],
    queryFn: () => fetchAdminEvents(serverTable.searchParams),
    initialData: { events: initialEvents, meta: initialMeta },
  });

  React.useEffect(() => {
    setPageMeta({
      pageCount: eventsQuery.data.meta.pageCount,
      totalRows: eventsQuery.data.meta.totalRows,
    });
  }, [
    eventsQuery.data.meta.pageCount,
    eventsQuery.data.meta.totalRows,
    setPageMeta,
  ]);

  const deleteMutation = useMutation({
    mutationFn: deleteAdminEvent,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingEvent(null);
      await queryClient.invalidateQueries({ queryKey: adminEventsQueryKey });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingEvent,
        onEdit: setEditingEvent,
        permissions,
      }),
    [permissions],
  );

  return (
    <section className="space-y-3">
      {permissions.canCreate ? (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            New event
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={eventsQuery.data.events}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <CalendarDays className="size-5" />
            </span>
            <p className="text-sm font-medium">No events found</p>
            <p className="text-xs text-muted-foreground">
              Published events will appear on the public site.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "status",
            options: EVENT_STATUS_OPTIONS,
            title: "Status",
          },
          {
            columnId: "posterStatus",
            options: posterFilterOptions,
            title: "Poster",
          },
        ]}
        getRowId={(event) => String(event.id)}
        initialColumnVisibility={{ posterStatus: false }}
        searchPlaceholder="Search events..."
        serverState={serverTable.state}
      />

      <EventDialog
        key="create-event"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
        permissions={permissions}
      />

      {editingEvent && permissions.canUpdate ? (
        <EventDialog
          event={editingEvent}
          key={`edit-${editingEvent.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingEvent(null);
          }}
          open
          permissions={permissions}
        />
      ) : null}

      <DeleteEventDialog
        event={deletingEvent}
        isPending={deleteMutation.isPending}
        onDelete={(eventId) => deleteMutation.mutate({ eventId })}
        onOpenChange={(open) => {
          if (!open) setDeletingEvent(null);
        }}
      />
    </section>
  );
}

function getColumns({
  onDelete,
  onEdit,
  permissions,
}: {
  onDelete: (event: EventRow) => void;
  onEdit: (event: EventRow) => void;
  permissions: EventTablePermissions;
}): ColumnDef<EventRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Event" />
      ),
      cell: ({ row }) => {
        const event = row.original;

        return (
          <div className="min-w-64 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{event.title}</span>
              <EventStatusBadge status={event.status} />
            </div>
            {event.description ? (
              <p className="max-w-xl truncate text-muted-foreground">
                {event.description}
              </p>
            ) : null}
          </div>
        );
      },
      meta: { label: "Event", className: "min-w-64" },
    },
    {
      accessorKey: "startsAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Starts" />
      ),
      cell: ({ row }) => formatDateTime(row.original.startsAt),
      sortingFn: dateSort,
      meta: { label: "Starts", className: "min-w-40" },
    },
    {
      accessorKey: "endsAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ends" />
      ),
      cell: ({ row }) => formatNullableDateTime(row.original.endsAt),
      sortingFn: dateSort,
      meta: { label: "Ends", className: "min-w-40" },
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) =>
        row.original.location ? (
          row.original.location
        ) : (
          <span className="text-muted-foreground">TBD</span>
        ),
      meta: { label: "Location", className: "min-w-40" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <EventStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      id: "poster",
      accessorFn: (row) => row.poster?.originalFilename ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Poster" />
      ),
      cell: ({ row }) =>
        row.original.poster ? (
          <a
            className="inline-flex max-w-48 items-center gap-1 truncate text-sm underline-offset-4 hover:underline"
            href={row.original.poster.publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-3.5" />
            {row.original.poster.originalFilename}
          </a>
        ) : (
          <span className="text-muted-foreground">None</span>
        ),
      meta: { label: "Poster", className: "min-w-44" },
    },
    {
      id: "posterStatus",
      accessorFn: (row) => (row.poster ? "has_poster" : "no_poster"),
      filterFn: stringArrayFilter,
      header: "Poster Status",
      meta: { label: "Poster Status" },
    },
    {
      accessorKey: "updatedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => formatDateTime(row.original.updatedAt),
      sortingFn: dateSort,
      meta: { label: "Updated" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <EventRowActions
          event={row.original}
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function EventRowActions({
  event,
  onDelete,
  onEdit,
  permissions,
}: {
  event: EventRow;
  onDelete: (event: EventRow) => void;
  onEdit: (event: EventRow) => void;
  permissions: EventTablePermissions;
}) {
  const hasActions = permissions.canUpdate || permissions.canDelete || event.poster;
  if (!hasActions) return null;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="size-8" size="icon" variant="ghost">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {permissions.canUpdate ? (
            <DropdownMenuItem onSelect={() => onEdit(event)}>
              <Edit3 className="size-4" />
              Edit event
            </DropdownMenuItem>
          ) : null}
          {event.poster ? (
            <DropdownMenuItem asChild>
              <a href={event.poster.publicUrl} rel="noreferrer" target="_blank">
                <ExternalLink className="size-4" />
                Open poster
              </a>
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(event)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete event
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EventDialog({
  event,
  mode,
  onOpenChange,
  open,
  permissions,
}: {
  event?: EventRow;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  permissions: EventTablePermissions;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New event" : "Edit event"}
          </DialogTitle>
          <DialogDescription>
            Published events appear on the public site.
          </DialogDescription>
        </DialogHeader>
        <EventForm
          event={event}
          mode={mode}
          onSaved={() => onOpenChange(false)}
          permissions={permissions}
        />
      </DialogContent>
    </Dialog>
  );
}

function EventForm({
  event,
  mode,
  onSaved,
  permissions,
}: {
  event?: EventRow;
  mode: "create" | "edit";
  onSaved: () => void;
  permissions: EventTablePermissions;
}) {
  const [values, setValues] = React.useState<EventFormValues>(() =>
    getInitialEventFormValues(event),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminEvent,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminEventsQueryKey });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminEvent,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminEventsQueryKey });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitEvent(formEvent: React.FormEvent<HTMLFormElement>): void {
    formEvent.preventDefault();
    const parsedInput = createEventInputSchema.safeParse({
      title: values.title,
      description: values.description,
      startsAt: values.startsAt,
      endsAt: values.endsAt,
      location: values.location,
      status: values.status,
      posterStorageObjectId: values.poster?.id ?? null,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the event details.",
      );
      return;
    }

    if (mode === "create") {
      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!event) {
      toast.error("Event not found.");
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      eventId: event.id,
    });
  }

  function updateStatus(value: string): void {
    const parsedStatus = eventStatusSchema.safeParse(value);
    if (!parsedStatus.success) return;

    setValues((current) => ({
      ...current,
      status: parsedStatus.data,
    }));
  }

  return (
    <form className="space-y-5" onSubmit={submitEvent}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            maxLength={255}
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                title: changeEvent.currentTarget.value,
              }))
            }
            placeholder="General meeting"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-starts-at">Starts</Label>
          <Input
            id="event-starts-at"
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                startsAt: changeEvent.currentTarget.value,
              }))
            }
            type="datetime-local"
            value={values.startsAt}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-ends-at">Ends</Label>
          <Input
            id="event-ends-at"
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                endsAt: changeEvent.currentTarget.value,
              }))
            }
            type="datetime-local"
            value={values.endsAt}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-location">Location</Label>
          <Input
            id="event-location"
            maxLength={255}
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                location: changeEvent.currentTarget.value,
              }))
            }
            placeholder="MELSSA auditorium"
            value={values.location}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-status">Status</Label>
          <Select onValueChange={updateStatus} value={values.status}>
            <SelectTrigger id="event-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUS_OPTIONS.map((option) => (
                <SelectItem
                  disabled={
                    option.value === "published" && !permissions.canPublish
                  }
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          className="min-h-32"
          id="event-description"
          maxLength={20_000}
          onChange={(changeEvent) =>
            setValues((current) => ({
              ...current,
              description: changeEvent.currentTarget.value,
            }))
          }
          placeholder="Event details"
          value={values.description}
        />
      </div>

      <StorageUploadField
        disabled={isPending}
        endpoint="eventPoster"
        label="Poster"
        onChange={(poster) =>
          setValues((current) => ({
            ...current,
            poster,
          }))
        }
        value={values.poster}
      />

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create event" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteEventDialog({
  event,
  isPending,
  onDelete,
  onOpenChange,
}: {
  event: EventRow | null;
  isPending: boolean;
  onDelete: (eventId: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={event !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete event</DialogTitle>
          <DialogDescription>
            {event
              ? `${event.title} will be removed from the event archive.`
              : "This event will be removed from the event archive."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!event || isPending}
            onClick={() => {
              if (event) onDelete(event.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventStatusBadge({ status }: { status: EventStatus }) {
  if (status === "published") {
    return <Badge>{EVENT_STATUS_LABELS[status]}</Badge>;
  }

  if (status === "cancelled") {
    return (
      <Badge variant="destructive">
        <CircleOff className="size-3" />
        {EVENT_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return <Badge variant="outline">{EVENT_STATUS_LABELS[status]}</Badge>;
}

async function fetchAdminEvents(searchParams: string) {
  const url = searchParams
    ? `/api/admin/events?${searchParams}`
    : "/api/admin/events";
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success ? parsedError.data.message : "Failed to load events.",
    );
  }

  return adminEventsResponseSchema.parse(body);
}

async function createAdminEvent(input: CreateEventInput): Promise<ActionResult> {
  const response = await fetch("/api/admin/events", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Event creation failed.");
}

async function updateAdminEvent(input: UpdateEventInput): Promise<ActionResult> {
  const response = await fetch("/api/admin/events", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Event update failed.");
}

async function deleteAdminEvent({
  eventId,
}: {
  eventId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/events", {
    body: JSON.stringify({ eventId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Event deletion failed.");
}

async function parseActionResponse(
  response: Response,
  fallback: string,
): Promise<ActionResult> {
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message || fallback);
  }

  return result;
}

function getInitialEventFormValues(event?: EventRow): EventFormValues {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    startsAt: toDateTimeLocalValue(event?.startsAt ?? null),
    endsAt: toDateTimeLocalValue(event?.endsAt ?? null),
    location: event?.location ?? "",
    status: event?.status ?? "draft",
    poster: event?.poster
      ? {
          id: event.poster.id,
          objectKey: event.poster.objectKey,
          publicUrl: event.poster.publicUrl,
        }
      : null,
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function stringArrayFilter<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
): boolean {
  const selected = toStringArray(filterValue);
  if (selected.length === 0) return true;

  const value = row.getValue(columnId);
  return typeof value === "string" && selected.includes(value);
}

function dateSort<TData>(
  first: Row<TData>,
  second: Row<TData>,
  columnId: string,
): number {
  return dateValue(first.getValue(columnId)) - dateValue(second.getValue(columnId));
}

function dateValue(value: unknown): number {
  return typeof value === "string" ? new Date(value).getTime() : 0;
}

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

function formatNullableDateTime(value: string | null): string {
  return value ? formatDateTime(value) : "No end time";
}

function toDateTimeLocalValue(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
