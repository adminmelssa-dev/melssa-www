"use client";

import * as React from "react";
import {
  Archive,
  Award,
  Edit3,
  ExternalLink,
  FileText,
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
  contentStatusSchema,
  type ContentStatus,
} from "@/modules/content/contracts";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  SCHOLARSHIP_APPLICATION_MODE_LABELS,
  SCHOLARSHIP_APPLICATION_MODE_OPTIONS,
  adminScholarshipProgramsResponseSchema,
  createScholarshipProgramInputSchema,
  scholarshipApplicationModeSchema,
  type CreateScholarshipProgramInput,
  type ScholarshipApplicationMode,
  type ScholarshipProgramRow,
  type UpdateScholarshipProgramInput,
} from "@/modules/scholarships/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { DataTablePageMeta } from "@/lib/data-table-query";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminScholarshipsQueryKey = ["admin-scholarships"];

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface ScholarshipFormValues {
  title: string;
  slug: string;
  providerName: string;
  summary: string;
  description: string;
  status: ContentStatus;
  academicYear: string;
  amountDescription: string;
  eligibility: string;
  requirements: string;
  applicationMode: ScholarshipApplicationMode;
  applicationUrl: string;
  applicationInstructions: string;
  contactEmail: string;
  opensAt: string;
  closesAt: string;
  attachment: UploadedStorageObject | null;
}

interface ScholarshipTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

interface ScholarshipsTableProps {
  initialMeta: DataTablePageMeta;
  programs: ScholarshipProgramRow[];
  permissions: ScholarshipTablePermissions;
}

export function ScholarshipsTable({
  initialMeta,
  programs,
  permissions,
}: ScholarshipsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingProgram, setEditingProgram] =
    React.useState<ScholarshipProgramRow | null>(null);
  const [deletingProgram, setDeletingProgram] =
    React.useState<ScholarshipProgramRow | null>(null);
  const queryClient = useQueryClient();
  const serverTable = useServerDataTable();
  const setPageMeta = serverTable.setPageMeta;

  const scholarshipsQuery = useQuery({
    queryKey: [...adminScholarshipsQueryKey, serverTable.queryKey],
    queryFn: () => fetchAdminScholarships(serverTable.searchParams),
    initialData: { meta: initialMeta, scholarshipPrograms: programs },
  });

  React.useEffect(() => {
    setPageMeta({
      pageCount: scholarshipsQuery.data.meta.pageCount,
      totalRows: scholarshipsQuery.data.meta.totalRows,
    });
  }, [
    scholarshipsQuery.data.meta.pageCount,
    scholarshipsQuery.data.meta.totalRows,
    setPageMeta,
  ]);

  const deleteMutation = useMutation({
    mutationFn: deleteAdminScholarshipProgram,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingProgram(null);
      await queryClient.invalidateQueries({
        queryKey: adminScholarshipsQueryKey,
      });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingProgram,
        onEdit: setEditingProgram,
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
            New scholarship
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={scholarshipsQuery.data.scholarshipPrograms}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <Award className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No scholarship programmes found</p>
            <p className="text-xs text-muted-foreground">
              Published scholarship information will appear on the public site.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "status",
            options: CONTENT_STATUS_OPTIONS,
            title: "Status",
          },
          {
            columnId: "applicationMode",
            options: SCHOLARSHIP_APPLICATION_MODE_OPTIONS,
            title: "Application",
          },
        ]}
        getRowId={(program) => String(program.id)}
        searchPlaceholder="Search scholarships..."
        serverState={serverTable.state}
      />

      <ScholarshipDialog
        key="create-scholarship"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
        permissions={permissions}
      />

      {editingProgram && permissions.canUpdate ? (
        <ScholarshipDialog
          key={`edit-${editingProgram.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingProgram(null);
          }}
          open
          permissions={permissions}
          program={editingProgram}
        />
      ) : null}

      <DeleteScholarshipDialog
        isPending={deleteMutation.isPending}
        onDelete={(scholarshipProgramId) =>
          deleteMutation.mutate({ scholarshipProgramId })
        }
        onOpenChange={(open) => {
          if (!open) setDeletingProgram(null);
        }}
        program={deletingProgram}
      />
    </section>
  );
}

function getColumns({
  onDelete,
  onEdit,
  permissions,
}: {
  onDelete: (program: ScholarshipProgramRow) => void;
  onEdit: (program: ScholarshipProgramRow) => void;
  permissions: ScholarshipTablePermissions;
}): ColumnDef<ScholarshipProgramRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Programme" />
      ),
      cell: ({ row }) => (
        <div className="min-w-64 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.original.title}</span>
            <ScholarshipStatusBadge status={row.original.status} />
          </div>
          <p className="text-muted-foreground">{row.original.providerName}</p>
        </div>
      ),
      meta: { label: "Programme", className: "min-w-64" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <ScholarshipStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      accessorKey: "applicationMode",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Application" />
      ),
      cell: ({ row }) =>
        SCHOLARSHIP_APPLICATION_MODE_LABELS[row.original.applicationMode],
      meta: { label: "Application" },
    },
    {
      accessorKey: "closesAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Deadline" />
      ),
      cell: ({ row }) => formatDate(row.original.closesAt),
      sortingFn: nullableDateSort,
      meta: { label: "Deadline" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <ScholarshipRowActions
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
          program={row.original}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function ScholarshipRowActions({
  onDelete,
  onEdit,
  permissions,
  program,
}: {
  onDelete: (program: ScholarshipProgramRow) => void;
  onEdit: (program: ScholarshipProgramRow) => void;
  permissions: ScholarshipTablePermissions;
  program: ScholarshipProgramRow;
}) {
  const hasActions =
    permissions.canUpdate ||
    permissions.canDelete ||
    program.applicationUrl ||
    program.attachment;
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
        <DropdownMenuContent align="end" className="w-52">
          {permissions.canUpdate ? (
            <DropdownMenuItem onSelect={() => onEdit(program)}>
              <Edit3 className="size-4" />
              Edit scholarship
            </DropdownMenuItem>
          ) : null}
          {program.applicationUrl ? (
            <DropdownMenuItem asChild>
              <a href={program.applicationUrl} rel="noreferrer" target="_blank">
                <ExternalLink className="size-4" />
                Open application link
              </a>
            </DropdownMenuItem>
          ) : null}
          {program.attachment ? (
            <DropdownMenuItem asChild>
              <a
                href={program.attachment.publicUrl}
                rel="noreferrer"
                target="_blank"
              >
                <FileText className="size-4" />
                Open attachment
              </a>
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(program)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete scholarship
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ScholarshipDialog({
  mode,
  onOpenChange,
  open,
  permissions,
  program,
}: {
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  permissions: ScholarshipTablePermissions;
  program?: ScholarshipProgramRow;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New scholarship" : "Edit scholarship"}
          </DialogTitle>
          <DialogDescription>
            Publish eligibility, deadlines, and external application guidance.
          </DialogDescription>
        </DialogHeader>
        <ScholarshipForm
          mode={mode}
          onSaved={() => onOpenChange(false)}
          permissions={permissions}
          program={program}
        />
      </DialogContent>
    </Dialog>
  );
}

function ScholarshipForm({
  mode,
  onSaved,
  permissions,
  program,
}: {
  mode: "create" | "edit";
  onSaved: () => void;
  permissions: ScholarshipTablePermissions;
  program?: ScholarshipProgramRow;
}) {
  const [values, setValues] = React.useState<ScholarshipFormValues>(() =>
    getInitialScholarshipFormValues(program),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminScholarshipProgram,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminScholarshipsQueryKey });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminScholarshipProgram,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminScholarshipsQueryKey });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitScholarship(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const input = {
      title: values.title,
      slug: values.slug,
      providerName: values.providerName,
      summary: values.summary,
      description: values.description,
      status: values.status,
      academicYear: values.academicYear,
      amountDescription: values.amountDescription,
      eligibility: values.eligibility,
      requirements: values.requirements,
      applicationMode: values.applicationMode,
      applicationUrl: values.applicationUrl,
      applicationInstructions: values.applicationInstructions,
      contactEmail: values.contactEmail,
      opensAt: toIsoDateTime(values.opensAt),
      closesAt: toIsoDateTime(values.closesAt),
      attachmentStorageObjectId: values.attachment?.id ?? null,
    };

    if (mode === "create") {
      const parsedInput = createScholarshipProgramInputSchema.safeParse(input);

      if (!parsedInput.success) {
        toast.error(
          parsedInput.error.issues[0]?.message ??
            "Check the scholarship details.",
        );
        return;
      }

      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!program) {
      toast.error("Scholarship programme not found.");
      return;
    }

    const parsedInput = createScholarshipProgramInputSchema.safeParse(input);

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ??
          "Check the scholarship details.",
      );
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      scholarshipProgramId: program.id,
    });
  }

  function updateStatus(value: string): void {
    const parsedStatus = contentStatusSchema.safeParse(value);
    if (!parsedStatus.success) return;

    setValues((current) => ({ ...current, status: parsedStatus.data }));
  }

  function updateApplicationMode(value: string): void {
    const parsedMode = scholarshipApplicationModeSchema.safeParse(value);
    if (!parsedMode.success) return;

    setValues((current) => ({
      ...current,
      applicationMode: parsedMode.data,
    }));
  }

  return (
    <form className="space-y-5" onSubmit={submitScholarship}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scholarship-title">Title</Label>
          <Input
            id="scholarship-title"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                title: event.currentTarget.value,
              }))
            }
            placeholder="Alumni Emergency Support Grant"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scholarship-slug">Slug</Label>
          <Input
            id="scholarship-slug"
            maxLength={180}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                slug: event.currentTarget.value,
              }))
            }
            placeholder="alumni-emergency-support"
            value={values.slug}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scholarship-provider">Provider</Label>
          <Input
            id="scholarship-provider"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                providerName: event.currentTarget.value,
              }))
            }
            placeholder="MELSSA Alumni Desk"
            value={values.providerName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scholarship-status">Status</Label>
          <Select onValueChange={updateStatus} value={values.status}>
            <SelectTrigger id="scholarship-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_STATUS_OPTIONS.map((option) => (
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

        <div className="space-y-2">
          <Label htmlFor="scholarship-mode">Application mode</Label>
          <Select
            onValueChange={updateApplicationMode}
            value={values.applicationMode}
          >
            <SelectTrigger id="scholarship-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHOLARSHIP_APPLICATION_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scholarship-year">Academic year</Label>
          <Input
            id="scholarship-year"
            maxLength={20}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                academicYear: event.currentTarget.value,
              }))
            }
            placeholder="2025/2026"
            value={values.academicYear}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scholarship-opens">Opens</Label>
          <Input
            id="scholarship-opens"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                opensAt: event.currentTarget.value,
              }))
            }
            type="date"
            value={values.opensAt}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scholarship-closes">Closes</Label>
          <Input
            id="scholarship-closes"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                closesAt: event.currentTarget.value,
              }))
            }
            type="date"
            value={values.closesAt}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scholarship-summary">Summary</Label>
        <Textarea
          id="scholarship-summary"
          maxLength={1_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              summary: event.currentTarget.value,
            }))
          }
          placeholder="Short preview for students"
          value={values.summary}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scholarship-description">Description</Label>
        <Textarea
          className="min-h-36"
          id="scholarship-description"
          maxLength={20_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.currentTarget.value,
            }))
          }
          placeholder="Programme overview and context"
          value={values.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scholarship-amount">Amount</Label>
          <Input
            id="scholarship-amount"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                amountDescription: event.currentTarget.value,
              }))
            }
            placeholder="Up to GHS 2,000"
            value={values.amountDescription}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scholarship-contact">Contact email</Label>
          <Input
            id="scholarship-contact"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                contactEmail: event.currentTarget.value,
              }))
            }
            placeholder="welfare@example.com"
            type="email"
            value={values.contactEmail}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scholarship-eligibility">Eligibility</Label>
        <Textarea
          id="scholarship-eligibility"
          maxLength={5_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              eligibility: event.currentTarget.value,
            }))
          }
          placeholder="Who can apply"
          value={values.eligibility}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scholarship-requirements">Requirements</Label>
        <Textarea
          id="scholarship-requirements"
          maxLength={5_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              requirements: event.currentTarget.value,
            }))
          }
          placeholder="Documents or prerequisites"
          value={values.requirements}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scholarship-application-url">Application URL</Label>
        <Input
          id="scholarship-application-url"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              applicationUrl: event.currentTarget.value,
            }))
          }
          placeholder="https://example.com/apply"
          type="url"
          value={values.applicationUrl}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scholarship-instructions">Application instructions</Label>
        <Textarea
          id="scholarship-instructions"
          maxLength={5_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              applicationInstructions: event.currentTarget.value,
            }))
          }
          placeholder="How students should prepare or apply"
          value={values.applicationInstructions}
        />
      </div>

      <StorageUploadField
        disabled={isPending}
        endpoint="scholarshipAttachment"
        label="Attachment"
        onChange={(attachment) =>
          setValues((current) => ({
            ...current,
            attachment,
          }))
        }
        value={values.attachment}
      />

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create scholarship" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteScholarshipDialog({
  isPending,
  onDelete,
  onOpenChange,
  program,
}: {
  isPending: boolean;
  onDelete: (scholarshipProgramId: number) => void;
  onOpenChange: (open: boolean) => void;
  program: ScholarshipProgramRow | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={program !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete scholarship</DialogTitle>
          <DialogDescription>
            {program
              ? `${program.title} will be removed from scholarship listings.`
              : "This scholarship will be removed from scholarship listings."}
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
            disabled={!program || isPending}
            onClick={() => {
              if (program) onDelete(program.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete scholarship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScholarshipStatusBadge({ status }: { status: ContentStatus }) {
  if (status === "published") {
    return <Badge>{CONTENT_STATUS_LABELS[status]}</Badge>;
  }

  if (status === "archived") {
    return (
      <Badge variant="secondary">
        <Archive className="size-3" />
        {CONTENT_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return <Badge variant="outline">{CONTENT_STATUS_LABELS[status]}</Badge>;
}

async function fetchAdminScholarships(searchParams: string) {
  const response = await fetch(`/api/admin/scholarships?${searchParams}`, {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load scholarships.",
    );
  }

  return adminScholarshipProgramsResponseSchema.parse(body);
}

async function createAdminScholarshipProgram(
  input: CreateScholarshipProgramInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/scholarships", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Scholarship creation failed.");
}

async function updateAdminScholarshipProgram(
  input: UpdateScholarshipProgramInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/scholarships", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Scholarship update failed.");
}

async function deleteAdminScholarshipProgram({
  scholarshipProgramId,
}: {
  scholarshipProgramId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/scholarships", {
    body: JSON.stringify({ scholarshipProgramId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Scholarship deletion failed.");
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

function getInitialScholarshipFormValues(
  program?: ScholarshipProgramRow,
): ScholarshipFormValues {
  return {
    title: program?.title ?? "",
    slug: program?.slug ?? "",
    providerName: program?.providerName ?? "",
    summary: program?.summary ?? "",
    description: program?.description ?? "",
    status: program?.status ?? "draft",
    academicYear: program?.academicYear ?? "",
    amountDescription: program?.amountDescription ?? "",
    eligibility: program?.eligibility ?? "",
    requirements: program?.requirements ?? "",
    applicationMode: program?.applicationMode ?? "information",
    applicationUrl: program?.applicationUrl ?? "",
    applicationInstructions: program?.applicationInstructions ?? "",
    contactEmail: program?.contactEmail ?? "",
    opensAt: fromIsoDate(program?.opensAt ?? null),
    closesAt: fromIsoDate(program?.closesAt ?? null),
    attachment: program?.attachment
      ? {
          id: program.attachment.id,
          objectKey: program.attachment.objectKey,
          publicUrl: program.attachment.publicUrl,
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
  return value ? dateFormatter.format(new Date(value)) : "Not set";
}

function fromIsoDate(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function toIsoDateTime(value: string): string | null {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}
