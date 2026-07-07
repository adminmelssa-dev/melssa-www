"use client";

import * as React from "react";
import {
  Archive,
  Download,
  Edit3,
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
  SEMESTER_TERM_OPTIONS,
  semesterTermSchema,
  type SemesterTerm,
} from "@/modules/academics/contracts";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  FINANCE_DOCUMENT_TYPE_LABELS,
  FINANCE_DOCUMENT_TYPE_OPTIONS,
  adminFinanceDocumentsResponseSchema,
  createFinanceDocumentInputSchema,
  financeDocumentTypeSchema,
  updateFinanceDocumentInputSchema,
  type CreateFinanceDocumentInput,
  type FinanceDocumentRow,
  type FinanceDocumentType,
  type UpdateFinanceDocumentInput,
} from "@/modules/finance/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminFinanceDocumentsQueryKey = ["admin-finance-documents"];
const noSemesterValue = "none";

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface FinanceDocumentFormValues {
  title: string;
  summary: string;
  type: FinanceDocumentType;
  academicYear: string;
  semester: SemesterTerm | typeof noSemesterValue;
  programmeName: string;
  datePresented: string;
  status: ContentStatus;
  file: UploadedStorageObject | null;
}

interface FinanceDocumentsTableProps {
  documents: FinanceDocumentRow[];
  permissions: FinanceDocumentTablePermissions;
}

interface FinanceDocumentTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export function FinanceDocumentsTable({
  documents,
  permissions,
}: FinanceDocumentsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingDocument, setEditingDocument] =
    React.useState<FinanceDocumentRow | null>(null);
  const [deletingDocument, setDeletingDocument] =
    React.useState<FinanceDocumentRow | null>(null);
  const queryClient = useQueryClient();

  const financeDocumentsQuery = useQuery({
    queryKey: adminFinanceDocumentsQueryKey,
    queryFn: fetchAdminFinanceDocuments,
    initialData: { financeDocuments: documents },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminFinanceDocument,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingDocument(null);
      await queryClient.invalidateQueries({
        queryKey: adminFinanceDocumentsQueryKey,
      });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingDocument,
        onEdit: setEditingDocument,
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
            Upload finance document
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={financeDocumentsQuery.data.financeDocuments}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <FileText className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No finance documents found</p>
            <p className="text-xs text-muted-foreground">
              Uploaded reports and budgets will appear here.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "type",
            options: FINANCE_DOCUMENT_TYPE_OPTIONS,
            title: "Type",
          },
          {
            columnId: "status",
            options: CONTENT_STATUS_OPTIONS,
            title: "Status",
          },
        ]}
        getRowId={(document) => String(document.id)}
        searchPlaceholder="Search finance documents..."
      />

      <FinanceDocumentDialog
        key="create-finance-document"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
        permissions={permissions}
      />

      {editingDocument && permissions.canUpdate ? (
        <FinanceDocumentDialog
          document={editingDocument}
          key={`edit-${editingDocument.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingDocument(null);
          }}
          open
          permissions={permissions}
        />
      ) : null}

      <DeleteFinanceDocumentDialog
        document={deletingDocument}
        isPending={deleteMutation.isPending}
        onDelete={(financeDocumentId) =>
          deleteMutation.mutate({ financeDocumentId })
        }
        onOpenChange={(open) => {
          if (!open) setDeletingDocument(null);
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
  onDelete: (document: FinanceDocumentRow) => void;
  onEdit: (document: FinanceDocumentRow) => void;
  permissions: FinanceDocumentTablePermissions;
}): ColumnDef<FinanceDocumentRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Document" />
      ),
      cell: ({ row }) => {
        const document = row.original;

        return (
          <div className="min-w-64 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{document.title}</span>
              <FinanceStatusBadge status={document.status} />
              {document.file ? null : (
                <Badge variant="destructive">Missing file</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {FINANCE_DOCUMENT_TYPE_LABELS[document.type]}
            </p>
          </div>
        );
      },
      meta: { label: "Document", className: "min-w-64" },
    },
    {
      accessorKey: "type",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => FINANCE_DOCUMENT_TYPE_LABELS[row.original.type],
      meta: { label: "Type" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <FinanceStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      accessorKey: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Academic Year" />
      ),
      cell: ({ row }) => row.original.academicYear,
      meta: { label: "Academic Year" },
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
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <FinanceDocumentRowActions
          document={row.original}
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function FinanceDocumentRowActions({
  document,
  onDelete,
  onEdit,
  permissions,
}: {
  document: FinanceDocumentRow;
  onDelete: (document: FinanceDocumentRow) => void;
  onEdit: (document: FinanceDocumentRow) => void;
  permissions: FinanceDocumentTablePermissions;
}) {
  const hasActions = permissions.canUpdate || permissions.canDelete;

  if (!hasActions) {
    if (!document.file) return null;

    return (
      <div className="flex justify-end">
        <Button asChild className="size-8" size="icon" variant="ghost">
          <a href={document.file.publicUrl} rel="noreferrer" target="_blank">
            <Download className="size-4" />
            <span className="sr-only">Open document</span>
          </a>
        </Button>
      </div>
    );
  }

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
            <DropdownMenuItem onSelect={() => onEdit(document)}>
              <Edit3 className="size-4" />
              Edit document
            </DropdownMenuItem>
          ) : null}
          {document.file ? (
            <DropdownMenuItem asChild>
              <a href={document.file.publicUrl} rel="noreferrer" target="_blank">
                <Download className="size-4" />
                Open document
              </a>
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(document)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete document
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FinanceDocumentDialog({
  document,
  mode,
  onOpenChange,
  open,
  permissions,
}: {
  document?: FinanceDocumentRow;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  permissions: FinanceDocumentTablePermissions;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Upload finance document" : "Edit document"}
          </DialogTitle>
          <DialogDescription>
            Finance documents power the public accountability archive.
          </DialogDescription>
        </DialogHeader>
        <FinanceDocumentForm
          document={document}
          mode={mode}
          onSaved={() => onOpenChange(false)}
          permissions={permissions}
        />
      </DialogContent>
    </Dialog>
  );
}

function FinanceDocumentForm({
  document,
  mode,
  onSaved,
  permissions,
}: {
  document?: FinanceDocumentRow;
  mode: "create" | "edit";
  onSaved: () => void;
  permissions: FinanceDocumentTablePermissions;
}) {
  const [values, setValues] = React.useState<FinanceDocumentFormValues>(() =>
    getInitialFinanceDocumentFormValues(document),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminFinanceDocument,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({
        queryKey: adminFinanceDocumentsQueryKey,
      });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminFinanceDocument,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({
        queryKey: adminFinanceDocumentsQueryKey,
      });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitDocument(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const baseInput = {
      title: values.title,
      summary: values.summary,
      type: values.type,
      academicYear: values.academicYear,
      semester:
        values.semester === noSemesterValue ? null : values.semester,
      programmeName: values.programmeName,
      datePresented: toIsoDateTime(values.datePresented),
      status: values.status,
    };

    if (mode === "create") {
      const parsedInput = createFinanceDocumentInputSchema.safeParse({
        ...baseInput,
        storageObjectId: values.file?.id ?? "",
      });

      if (!parsedInput.success) {
        toast.error(
          parsedInput.error.issues[0]?.message ??
            "Check the finance document details.",
        );
        return;
      }

      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!document) {
      toast.error("Finance document not found.");
      return;
    }

    const parsedInput = updateFinanceDocumentInputSchema.safeParse({
      ...baseInput,
      financeDocumentId: document.id,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ??
          "Check the finance document details.",
      );
      return;
    }

    updateMutation.mutate(parsedInput.data);
  }

  function updateType(value: string): void {
    const parsedType = financeDocumentTypeSchema.safeParse(value);
    if (!parsedType.success) return;

    setValues((current) => ({
      ...current,
      type: parsedType.data,
    }));
  }

  function updateSemester(value: string): void {
    if (value === noSemesterValue) {
      setValues((current) => ({ ...current, semester: noSemesterValue }));
      return;
    }

    const parsedSemester = semesterTermSchema.safeParse(value);
    if (!parsedSemester.success) return;

    setValues((current) => ({
      ...current,
      semester: parsedSemester.data,
    }));
  }

  function updateStatus(value: string): void {
    const parsedStatus = contentStatusSchema.safeParse(value);
    if (!parsedStatus.success) return;

    setValues((current) => ({
      ...current,
      status: parsedStatus.data,
    }));
  }

  return (
    <form className="space-y-5" onSubmit={submitDocument}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="finance-title">Title</Label>
          <Input
            id="finance-title"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                title: event.currentTarget.value,
              }))
            }
            placeholder="First semester accountability report"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="finance-type">Type</Label>
          <Select onValueChange={updateType} value={values.type}>
            <SelectTrigger id="finance-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINANCE_DOCUMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="finance-status">Status</Label>
          <Select onValueChange={updateStatus} value={values.status}>
            <SelectTrigger id="finance-status">
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
          <Label htmlFor="finance-year">Academic year</Label>
          <Input
            id="finance-year"
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
          <Label htmlFor="finance-semester">Semester</Label>
          <Select onValueChange={updateSemester} value={values.semester}>
            <SelectTrigger id="finance-semester">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noSemesterValue}>Not semester-specific</SelectItem>
              {SEMESTER_TERM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="finance-programme">Programme</Label>
          <Input
            id="finance-programme"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                programmeName: event.currentTarget.value,
              }))
            }
            placeholder="Health screening outreach"
            value={values.programmeName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="finance-date-presented">Date presented</Label>
          <Input
            id="finance-date-presented"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                datePresented: event.currentTarget.value,
              }))
            }
            type="date"
            value={values.datePresented}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="finance-summary">Summary</Label>
        <Textarea
          id="finance-summary"
          maxLength={1_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              summary: event.currentTarget.value,
            }))
          }
          placeholder="Short context for the archive"
          value={values.summary}
        />
      </div>

      {mode === "create" ? (
        <StorageUploadField
          disabled={isPending}
          endpoint="financeDocument"
          label="Finance PDF"
          onChange={(file) =>
            setValues((current) => ({
              ...current,
              file,
            }))
          }
          value={values.file}
        />
      ) : document ? (
        <div className="rounded-md border border-hairline bg-paper-2 p-3">
          <p className="text-sm font-medium">Current document</p>
          {document.file ? (
            <a
              className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
              href={document.file.publicUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Download className="size-3.5" />
              {document.file.originalFilename}
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              The uploaded file is missing or no longer completed.
            </p>
          )}
        </div>
      ) : null}

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create document" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteFinanceDocumentDialog({
  document,
  isPending,
  onDelete,
  onOpenChange,
}: {
  document: FinanceDocumentRow | null;
  isPending: boolean;
  onDelete: (financeDocumentId: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={document !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete finance document</DialogTitle>
          <DialogDescription>
            {document
              ? `${document.title} and its uploaded file will be removed.`
              : "This finance document and its uploaded file will be removed."}
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
            disabled={!document || isPending}
            onClick={() => {
              if (document) onDelete(document.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FinanceStatusBadge({ status }: { status: ContentStatus }) {
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

async function fetchAdminFinanceDocuments() {
  const response = await fetch("/api/admin/finance", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load finance documents.",
    );
  }

  return adminFinanceDocumentsResponseSchema.parse(body);
}

async function createAdminFinanceDocument(
  input: CreateFinanceDocumentInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/finance", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Finance document creation failed.");
}

async function updateAdminFinanceDocument(
  input: UpdateFinanceDocumentInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/finance", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Finance document update failed.");
}

async function deleteAdminFinanceDocument({
  financeDocumentId,
}: {
  financeDocumentId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/finance", {
    body: JSON.stringify({ financeDocumentId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Finance document deletion failed.");
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

function getInitialFinanceDocumentFormValues(
  document?: FinanceDocumentRow,
): FinanceDocumentFormValues {
  return {
    title: document?.title ?? "",
    summary: document?.summary ?? "",
    type: document?.type ?? "semester_report",
    academicYear: document?.academicYear ?? "",
    semester: document?.semester ?? noSemesterValue,
    programmeName: document?.programmeName ?? "",
    datePresented: fromIsoDate(document?.datePresented ?? null),
    status: document?.status ?? "draft",
    file: document?.file
      ? {
          id: document.file.id,
          objectKey: document.file.objectKey,
          publicUrl: document.file.publicUrl,
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
