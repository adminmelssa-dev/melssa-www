"use client";

import * as React from "react";
import {
  Archive,
  BookOpenText,
  Edit3,
  MailCheck,
  MoreHorizontal,
  Plus,
  Send,
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
  BULLETIN_SECTION_CATEGORY_LABELS,
  BULLETIN_SECTION_CATEGORY_OPTIONS,
  BULLETIN_STATUS_LABELS,
  BULLETIN_STATUS_OPTIONS,
  adminBulletinsResponseSchema,
  bulletinSectionCategorySchema,
  createBulletinIssueInputSchema,
  type AdminBulletinMutation,
  type AdminBulletinsResponse,
  type BulletinIssueRow,
  type BulletinIssueStatus,
  type BulletinSection,
  type CreateBulletinIssueInput,
  type UpdateBulletinIssueInput,
} from "@/modules/bulletin/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";

const adminBulletinsQueryKey = ["admin-bulletins"];

const deliveryFilterOptions = [
  { label: "No failures", value: "clean" },
  { label: "Has failures", value: "issues" },
  { label: "Not sent", value: "not_sent" },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface BulletinFormValues {
  title: string;
  subject: string;
  previewText: string;
  editorNote: string;
  sections: BulletinSection[];
  audienceTags: string;
}

interface BulletinsTableProps {
  initialBulletins: BulletinIssueRow[];
  initialSubscriberCount: number;
  permissions: BulletinTablePermissions;
}

interface BulletinTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canSend: boolean;
  canArchive: boolean;
}

export function BulletinsTable({
  initialBulletins,
  initialSubscriberCount,
  permissions,
}: BulletinsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingBulletin, setEditingBulletin] =
    React.useState<BulletinIssueRow | null>(null);
  const [sendingBulletin, setSendingBulletin] =
    React.useState<BulletinIssueRow | null>(null);
  const [archivingBulletin, setArchivingBulletin] =
    React.useState<BulletinIssueRow | null>(null);
  const queryClient = useQueryClient();

  const bulletinsQuery = useQuery({
    queryKey: adminBulletinsQueryKey,
    queryFn: fetchAdminBulletins,
    initialData: {
      bulletins: initialBulletins,
      subscriberCount: initialSubscriberCount,
    },
  });

  const sendMutation = useMutation({
    mutationFn: sendAdminBulletin,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setSendingBulletin(null);
      await queryClient.invalidateQueries({ queryKey: adminBulletinsQueryKey });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveAdminBulletin,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setArchivingBulletin(null);
      await queryClient.invalidateQueries({ queryKey: adminBulletinsQueryKey });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onArchive: setArchivingBulletin,
        onEdit: setEditingBulletin,
        onSend: setSendingBulletin,
        permissions,
      }),
    [permissions],
  );

  return (
    <section className="space-y-3">
      {permissions.canCreate ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {bulletinsQuery.data.subscriberCount} active subscriber
            {bulletinsQuery.data.subscriberCount === 1 ? "" : "s"}
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            New bulletin
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={bulletinsQuery.data.bulletins}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <BookOpenText className="size-5" />
            </span>
            <p className="text-sm font-medium">No bulletins found</p>
            <p className="text-xs text-muted-foreground">
              Draft the first weekly issue when updates are ready.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "status",
            options: BULLETIN_STATUS_OPTIONS,
            title: "Status",
          },
          {
            columnId: "deliveryHealth",
            options: deliveryFilterOptions,
            title: "Delivery",
          },
        ]}
        getRowId={(bulletin) => String(bulletin.id)}
        initialColumnVisibility={{
          createdAt: false,
          deliveryHealth: false,
        }}
        searchPlaceholder="Search bulletins..."
      />

      <BulletinDialog
        key="create-bulletin"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      {editingBulletin && permissions.canUpdate ? (
        <BulletinDialog
          bulletin={editingBulletin}
          key={`edit-${editingBulletin.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingBulletin(null);
          }}
          open
        />
      ) : null}

      <SendBulletinDialog
        bulletin={sendingBulletin}
        isPending={sendMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setSendingBulletin(null);
        }}
        onSend={(bulletinId) =>
          sendMutation.mutate({
            type: "send",
            payload: { bulletinId },
          })
        }
        subscriberCount={bulletinsQuery.data.subscriberCount}
      />

      <ArchiveBulletinDialog
        bulletin={archivingBulletin}
        isPending={archiveMutation.isPending}
        onArchive={(bulletinId) =>
          archiveMutation.mutate({
            type: "archive",
            payload: { bulletinId },
          })
        }
        onOpenChange={(open) => {
          if (!open) setArchivingBulletin(null);
        }}
      />
    </section>
  );
}

function BulletinDialog({
  bulletin,
  mode,
  onOpenChange,
  open,
}: {
  bulletin?: BulletinIssueRow;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New bulletin" : "Edit bulletin"}
          </DialogTitle>
          <DialogDescription>
            Compose the weekly email from structured sections.
          </DialogDescription>
        </DialogHeader>
        <BulletinForm
          bulletin={bulletin}
          mode={mode}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function BulletinForm({
  bulletin,
  mode,
  onSaved,
}: {
  bulletin?: BulletinIssueRow;
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<BulletinFormValues>(() =>
    getInitialBulletinFormValues(bulletin),
  );
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: createAdminBulletin,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminBulletinsQueryKey });
      onSaved();
    },
  });
  const updateMutation = useMutation({
    mutationFn: updateAdminBulletin,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminBulletinsQueryKey });
      onSaved();
    },
  });
  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitBulletin(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsedInput = createBulletinIssueInputSchema.safeParse({
      title: values.title,
      subject: values.subject,
      previewText: values.previewText,
      editorNote: values.editorNote,
      sections: values.sections,
      audienceTags: parseTags(values.audienceTags),
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the bulletin details.",
      );
      return;
    }

    if (mode === "create") {
      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!bulletin) {
      toast.error("Bulletin not found.");
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      bulletinId: bulletin.id,
    });
  }

  function updateSection(
    index: number,
    updater: (section: BulletinSection) => BulletinSection,
  ): void {
    setValues((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? updater(section) : section,
      ),
    }));
  }

  function addSection(): void {
    setValues((current) => ({
      ...current,
      sections: [
        ...current.sections,
        { heading: "", body: "", category: "association" },
      ],
    }));
  }

  function removeSection(index: number): void {
    setValues((current) => ({
      ...current,
      sections:
        current.sections.length === 1
          ? current.sections
          : current.sections.filter((section, sectionIndex) => {
              return sectionIndex !== index;
            }),
    }));
  }

  return (
    <form className="space-y-5" onSubmit={submitBulletin}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bulletin-title">Issue title</Label>
              <Input
                id="bulletin-title"
                maxLength={255}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    title: event.currentTarget.value,
                  }))
                }
                placeholder="Week 7 lab brief"
                value={values.title}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bulletin-subject">Email subject</Label>
              <Input
                id="bulletin-subject"
                maxLength={180}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    subject: event.currentTarget.value,
                  }))
                }
                placeholder="MELSSA Weekly Bulletin: practicals, events, resources"
                value={values.subject}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bulletin-preview">Inbox preview</Label>
              <Input
                id="bulletin-preview"
                maxLength={255}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    previewText: event.currentTarget.value,
                  }))
                }
                placeholder="A short line shown beside the subject in inboxes"
                value={values.previewText}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bulletin-tags">Audience tags</Label>
              <Input
                id="bulletin-tags"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    audienceTags: event.currentTarget.value,
                  }))
                }
                placeholder="students, academic-week, congress"
                value={values.audienceTags}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulletin-editor-note">Editor note</Label>
            <Textarea
              className="min-h-28"
              id="bulletin-editor-note"
              maxLength={4_000}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  editorNote: event.currentTarget.value,
                }))
              }
              placeholder="Open with the context students need for the week."
              value={values.editorNote}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label>Sections</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSection}
                disabled={values.sections.length >= 8}
              >
                <Plus className="size-4" />
                Add section
              </Button>
            </div>

            {values.sections.map((section, index) => (
              <div
                className="space-y-3 rounded-lg border bg-card p-3"
                key={`section-${index}`}
              >
                <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
                  <Select
                    value={section.category}
                    onValueChange={(value) => {
                      const parsedCategory =
                        bulletinSectionCategorySchema.safeParse(value);
                      if (!parsedCategory.success) return;
                      updateSection(index, (current) => ({
                        ...current,
                        category: parsedCategory.data,
                      }));
                    }}
                  >
                    <SelectTrigger aria-label={`Section ${index + 1} category`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BULLETIN_SECTION_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label={`Section ${index + 1} heading`}
                    maxLength={120}
                    onChange={(event) =>
                      updateSection(index, (current) => ({
                        ...current,
                        heading: event.currentTarget.value,
                      }))
                    }
                    placeholder="Section heading"
                    value={section.heading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(index)}
                    disabled={values.sections.length === 1}
                    aria-label={`Remove section ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  aria-label={`Section ${index + 1} body`}
                  className="min-h-24"
                  maxLength={2_500}
                  onChange={(event) =>
                    updateSection(index, (current) => ({
                      ...current,
                      body: event.currentTarget.value,
                    }))
                  }
                  placeholder="Write the update in clear, student-facing language."
                  value={section.body}
                />
              </div>
            ))}
          </div>
        </div>

        <BulletinPreview values={values} />
      </div>

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create draft" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BulletinPreview({ values }: { values: BulletinFormValues }) {
  return (
    <aside className="h-fit rounded-lg border bg-paper-2 p-4">
      <div className="border-b border-hairline pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-ink">
          Email structure
        </p>
        <h3 className="mt-2 font-heading text-xl">
          {values.title || "Untitled bulletin"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {values.subject || "Subject line"}
        </p>
      </div>
      <div className="space-y-3 py-4">
        <PreviewBlock
          label="Editor note"
          value={values.editorNote || "Opening context for the week."}
        />
        {values.sections.map((section, index) => (
          <PreviewBlock
            key={`preview-${index}`}
            label={BULLETIN_SECTION_CATEGORY_LABELS[section.category]}
            value={section.heading || `Section ${index + 1}`}
          />
        ))}
      </div>
      <div className="border-t border-hairline pt-3 text-xs text-muted-foreground">
        {parseTags(values.audienceTags).length > 0
          ? parseTags(values.audienceTags).join(" / ")
          : "No audience tags"}
      </div>
    </aside>
  );
}

function PreviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-ink">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function getColumns({
  onArchive,
  onEdit,
  onSend,
  permissions,
}: {
  onArchive: (bulletin: BulletinIssueRow) => void;
  onEdit: (bulletin: BulletinIssueRow) => void;
  onSend: (bulletin: BulletinIssueRow) => void;
  permissions: BulletinTablePermissions;
}): ColumnDef<BulletinIssueRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bulletin" />
      ),
      cell: ({ row }) => {
        const bulletin = row.original;

        return (
          <div className="min-w-72 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{bulletin.title}</span>
              <BulletinStatusBadge status={bulletin.status} />
            </div>
            <p className="max-w-xl truncate text-muted-foreground">
              {bulletin.subject}
            </p>
          </div>
        );
      },
      meta: { label: "Bulletin", className: "min-w-72" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <BulletinStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      accessorKey: "audienceTags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tags" />
      ),
      cell: ({ row }) => (
        <div className="flex max-w-72 flex-wrap gap-1">
          {row.original.audienceTags.length > 0 ? (
            row.original.audienceTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </div>
      ),
      meta: { label: "Tags", className: "min-w-48" },
    },
    {
      id: "recipients",
      accessorFn: (row) => row.recipientCount,
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Recipients" />
      ),
      cell: ({ row }) =>
        row.original.status === "sent" ? row.original.recipientCount : "—",
      meta: { label: "Recipients" },
    },
    {
      id: "deliveryHealth",
      accessorFn: (row) => getDeliveryHealth(row),
      filterFn: stringArrayFilter,
      header: "Delivery",
      meta: { label: "Delivery" },
    },
    {
      accessorKey: "sentAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sent" />
      ),
      cell: ({ row }) => formatDate(row.original.sentAt),
      sortingFn: nullableDateSort,
      meta: { label: "Sent" },
    },
    {
      accessorKey: "updatedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => formatDate(row.original.updatedAt),
      sortingFn: nullableDateSort,
      meta: { label: "Updated" },
    },
    {
      accessorKey: "createdAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
      sortingFn: nullableDateSort,
      meta: { label: "Created" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <BulletinRowActions
          bulletin={row.original}
          onArchive={onArchive}
          onEdit={onEdit}
          onSend={onSend}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function BulletinRowActions({
  bulletin,
  onArchive,
  onEdit,
  onSend,
  permissions,
}: {
  bulletin: BulletinIssueRow;
  onArchive: (bulletin: BulletinIssueRow) => void;
  onEdit: (bulletin: BulletinIssueRow) => void;
  onSend: (bulletin: BulletinIssueRow) => void;
  permissions: BulletinTablePermissions;
}) {
  const canEdit = permissions.canUpdate && bulletin.status === "draft";
  const canSend = permissions.canSend && bulletin.status === "draft";
  const canArchive =
    permissions.canArchive && bulletin.status !== "archived";
  const hasActions = canEdit || canSend || canArchive;

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
        <DropdownMenuContent align="end" className="w-44">
          {canEdit ? (
            <DropdownMenuItem onSelect={() => onEdit(bulletin)}>
              <Edit3 className="size-4" />
              Edit bulletin
            </DropdownMenuItem>
          ) : null}
          {canSend ? (
            <DropdownMenuItem onSelect={() => onSend(bulletin)}>
              <Send className="size-4" />
              Send bulletin
            </DropdownMenuItem>
          ) : null}
          {canArchive ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onArchive(bulletin)}
                variant="destructive"
              >
                <Archive className="size-4" />
                Archive
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SendBulletinDialog({
  bulletin,
  isPending,
  onOpenChange,
  onSend,
  subscriberCount,
}: {
  bulletin: BulletinIssueRow | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (bulletinId: number) => void;
  subscriberCount: number;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={bulletin !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send bulletin</DialogTitle>
          <DialogDescription>
            {bulletin
              ? `${bulletin.title} will be sent to ${subscriberCount} active subscriber${subscriberCount === 1 ? "" : "s"}.`
              : "This bulletin will be sent to active subscribers."}
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
            disabled={!bulletin || isPending || subscriberCount === 0}
            onClick={() => {
              if (bulletin) onSend(bulletin.id);
            }}
            type="button"
          >
            <MailCheck className="size-4" />
            {isPending ? "Sending..." : "Send now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveBulletinDialog({
  bulletin,
  isPending,
  onArchive,
  onOpenChange,
}: {
  bulletin: BulletinIssueRow | null;
  isPending: boolean;
  onArchive: (bulletinId: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={bulletin !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive bulletin</DialogTitle>
          <DialogDescription>
            {bulletin
              ? `${bulletin.title} will be removed from active bulletin work.`
              : "This bulletin will be archived."}
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
            disabled={!bulletin || isPending}
            onClick={() => {
              if (bulletin) onArchive(bulletin.id);
            }}
            type="button"
            variant="destructive"
          >
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulletinStatusBadge({ status }: { status: BulletinIssueStatus }) {
  if (status === "sent") {
    return <Badge>{BULLETIN_STATUS_LABELS[status]}</Badge>;
  }

  if (status === "archived") {
    return (
      <Badge variant="secondary">
        <Archive className="size-3" />
        {BULLETIN_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return <Badge variant="outline">{BULLETIN_STATUS_LABELS[status]}</Badge>;
}

async function fetchAdminBulletins(): Promise<AdminBulletinsResponse> {
  const response = await fetch("/api/admin/bulletins", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load bulletins.",
    );
  }

  return adminBulletinsResponseSchema.parse(body);
}

async function createAdminBulletin(
  input: CreateBulletinIssueInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/bulletins", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Bulletin creation failed.");
}

async function updateAdminBulletin(
  input: UpdateBulletinIssueInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/bulletins", {
    body: JSON.stringify({
      type: "update",
      payload: input,
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Bulletin update failed.");
}

async function sendAdminBulletin(
  mutation: AdminBulletinMutation,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/bulletins", {
    body: JSON.stringify(mutation),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Bulletin send failed.");
}

async function archiveAdminBulletin(
  mutation: AdminBulletinMutation,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/bulletins", {
    body: JSON.stringify(mutation),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Bulletin archive failed.");
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

function getInitialBulletinFormValues(
  bulletin?: BulletinIssueRow,
): BulletinFormValues {
  return {
    title: bulletin?.title ?? "",
    subject: bulletin?.subject ?? "",
    previewText: bulletin?.previewText ?? "",
    editorNote: bulletin?.editorNote ?? "",
    sections:
      bulletin?.sections.map((section) => ({
        heading: section.heading,
        body: section.body,
        category: section.category,
      })) ?? [createEmptySection()],
    audienceTags: bulletin?.audienceTags.join(", ") ?? "",
  };
}

function createEmptySection(): BulletinSection {
  return {
    heading: "",
    body: "",
    category: "association",
  };
}

function parseTags(value: string): string[] {
  const tags = new Set<string>();

  for (const entry of value.split(",")) {
    const tag = entry.trim().toLowerCase();
    if (tag.length > 0) tags.add(tag);
  }

  return Array.from(tags);
}

function getDeliveryHealth(row: BulletinIssueRow): string {
  if (row.status !== "sent") return "not_sent";
  return row.deliveryFailureCount > 0 ? "issues" : "clean";
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

function nullableDateSort<TData>(
  first: Row<TData>,
  second: Row<TData>,
  columnId: string,
): number {
  return (
    dateValue(first.getValue(columnId)) - dateValue(second.getValue(columnId))
  );
}

function dateValue(value: unknown): number {
  return typeof value === "string" ? new Date(value).getTime() : 0;
}

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Never";
}
