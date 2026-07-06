"use client";

import * as React from "react";
import {
  Archive,
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
  ACADEMIC_LEVEL_LABELS,
  ACADEMIC_LEVEL_OPTIONS,
  SEMESTER_TERM_LABELS,
  SEMESTER_TERM_OPTIONS,
  academicLevelSchema,
  semesterTermSchema,
  type AcademicLevel,
  type SemesterTerm,
} from "@/modules/academics/contracts";
import type { CourseRow } from "@/modules/academics/contracts";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_OPTIONS,
  adminResourcesResponseSchema,
  contentStatusSchema,
  createResourceInputSchema,
  resourceTypeSchema,
  type ContentStatus,
  type CreateResourceInput,
  type ResourceRow,
  type ResourceType,
  type UpdateResourceInput,
} from "@/modules/resources/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import { formatBytes } from "@/lib/format-bytes";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminResourcesQueryKey = ["admin-resources"];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface ResourceFormValues {
  title: string;
  description: string;
  type: ResourceType;
  level: AcademicLevel;
  semester: SemesterTerm;
  academicYear: string;
  courseId: number | null;
  status: ContentStatus;
  file: UploadedStorageObject | null;
}

interface ResourcesTableProps {
  initialCourses: CourseRow[];
  initialResources: ResourceRow[];
  permissions: ResourceTablePermissions;
}

interface ResourceTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export function ResourcesTable({
  initialCourses,
  initialResources,
  permissions,
}: ResourcesTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingResource, setEditingResource] =
    React.useState<ResourceRow | null>(null);
  const [deletingResource, setDeletingResource] =
    React.useState<ResourceRow | null>(null);
  const queryClient = useQueryClient();

  const resourcesQuery = useQuery({
    queryKey: adminResourcesQueryKey,
    queryFn: fetchAdminResources,
    initialData: { resources: initialResources },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminResource,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingResource(null);
      await queryClient.invalidateQueries({ queryKey: adminResourcesQueryKey });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingResource,
        onEdit: setEditingResource,
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
            Upload resource
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={resourcesQuery.data.resources}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <FileText className="size-5" />
            </span>
            <p className="text-sm font-medium">No resources found</p>
            <p className="text-xs text-muted-foreground">
              Uploaded slides and past questions will appear here.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "type",
            options: RESOURCE_TYPE_OPTIONS,
            title: "Type",
          },
          {
            columnId: "status",
            options: CONTENT_STATUS_OPTIONS,
            title: "Status",
          },
          {
            columnId: "level",
            options: ACADEMIC_LEVEL_OPTIONS,
            title: "Level",
          },
          {
            columnId: "semester",
            options: SEMESTER_TERM_OPTIONS,
            title: "Semester",
          },
        ]}
        getRowId={(resource) => String(resource.id)}
        searchPlaceholder="Search by title, course, or file..."
      />

      <ResourceDialog
        courses={initialCourses}
        key="create-resource"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
        permissions={permissions}
      />

      {editingResource && permissions.canUpdate ? (
        <ResourceDialog
          courses={initialCourses}
          key={`edit-${editingResource.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingResource(null);
          }}
          open
          permissions={permissions}
          resource={editingResource}
        />
      ) : null}

      <DeleteResourceDialog
        isPending={deleteMutation.isPending}
        onDelete={(resourceId) => deleteMutation.mutate({ resourceId })}
        onOpenChange={(open) => {
          if (!open) setDeletingResource(null);
        }}
        resource={deletingResource}
      />
    </section>
  );
}

function getColumns({
  onDelete,
  onEdit,
  permissions,
}: {
  onDelete: (resource: ResourceRow) => void;
  onEdit: (resource: ResourceRow) => void;
  permissions: ResourceTablePermissions;
}): ColumnDef<ResourceRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Resource" />
      ),
      cell: ({ row }) => {
        const resource = row.original;

        return (
          <div className="min-w-64 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{resource.title}</span>
              <ResourceStatusBadge status={resource.status} />
            </div>
            <a
              className="inline-flex max-w-xl items-center gap-1 truncate text-muted-foreground underline-offset-4 hover:underline"
              href={resource.file.publicUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-3.5" />
              {resource.file.originalFilename}
            </a>
          </div>
        );
      },
      meta: { label: "Resource", className: "min-w-72" },
    },
    {
      accessorKey: "type",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => RESOURCE_TYPE_LABELS[row.original.type],
      meta: { label: "Type" },
    },
    {
      accessorKey: "level",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Level" />
      ),
      cell: ({ row }) => ACADEMIC_LEVEL_LABELS[row.original.level],
      meta: { label: "Level" },
    },
    {
      accessorKey: "semester",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Semester" />
      ),
      cell: ({ row }) => SEMESTER_TERM_LABELS[row.original.semester],
      meta: { label: "Semester" },
    },
    {
      id: "course",
      accessorFn: (row) =>
        row.course ? `${row.course.code} ${row.course.title}` : "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Course" />
      ),
      cell: ({ row }) =>
        row.original.course ? (
          <Badge variant="outline">{row.original.course.code}</Badge>
        ) : (
          <span className="text-muted-foreground">No course</span>
        ),
      meta: { label: "Course" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <ResourceStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      id: "fileSize",
      accessorFn: (row) => row.file.byteSize,
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
      cell: ({ row }) => formatBytes(row.original.file.byteSize),
      meta: { label: "Size" },
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
        <ResourceRowActions
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
          resource={row.original}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function ResourceRowActions({
  onDelete,
  onEdit,
  permissions,
  resource,
}: {
  onDelete: (resource: ResourceRow) => void;
  onEdit: (resource: ResourceRow) => void;
  permissions: ResourceTablePermissions;
  resource: ResourceRow;
}) {
  const hasActions = permissions.canUpdate || permissions.canDelete;
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
            <DropdownMenuItem onSelect={() => onEdit(resource)}>
              <Edit3 className="size-4" />
              Edit resource
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <a href={resource.file.publicUrl} rel="noreferrer" target="_blank">
              <ExternalLink className="size-4" />
              Open file
            </a>
          </DropdownMenuItem>
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(resource)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete resource
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ResourceDialog({
  courses,
  mode,
  onOpenChange,
  open,
  permissions,
  resource,
}: {
  courses: CourseRow[];
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  permissions: ResourceTablePermissions;
  resource?: ResourceRow;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Upload resource" : "Edit resource"}
          </DialogTitle>
          <DialogDescription>
            Resources are organized by type, level, semester, and course.
          </DialogDescription>
        </DialogHeader>
        <ResourceForm
          courses={courses}
          mode={mode}
          onSaved={() => onOpenChange(false)}
          permissions={permissions}
          resource={resource}
        />
      </DialogContent>
    </Dialog>
  );
}

function ResourceForm({
  courses,
  mode,
  onSaved,
  permissions,
  resource,
}: {
  courses: CourseRow[];
  mode: "create" | "edit";
  onSaved: () => void;
  permissions: ResourceTablePermissions;
  resource?: ResourceRow;
}) {
  const [values, setValues] = React.useState<ResourceFormValues>(() =>
    getInitialResourceFormValues(resource),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminResource,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminResourcesQueryKey });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminResource,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminResourcesQueryKey });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitResource(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const input = {
      title: values.title,
      description: values.description,
      type: values.type,
      level: values.level,
      semester: values.semester,
      academicYear: values.academicYear,
      courseId: values.courseId,
      storageObjectId: values.file?.id ?? "",
      status: values.status,
    };

    if (mode === "create") {
      const parsedInput = createResourceInputSchema.safeParse(input);

      if (!parsedInput.success) {
        toast.error(
          parsedInput.error.issues[0]?.message ?? "Check the resource details.",
        );
        return;
      }

      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!resource) {
      toast.error("Resource not found.");
      return;
    }

    const parsedInput = createResourceInputSchema.omit({
      storageObjectId: true,
    }).safeParse(input);

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the resource details.",
      );
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      resourceId: resource.id,
    });
  }

  function updateType(value: string): void {
    const parsedType = resourceTypeSchema.safeParse(value);
    if (!parsedType.success) return;

    setValues((current) => ({
      ...current,
      type: parsedType.data,
    }));
  }

  function updateLevel(value: string): void {
    const parsedLevel = academicLevelSchema.safeParse(value);
    if (!parsedLevel.success) return;

    setValues((current) => ({
      ...current,
      level: parsedLevel.data,
    }));
  }

  function updateSemester(value: string): void {
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

  function updateCourse(value: string): void {
    setValues((current) => ({
      ...current,
      courseId: value === "none" ? null : Number(value),
    }));
  }

  return (
    <form className="space-y-5" onSubmit={submitResource}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="resource-title">Title</Label>
          <Input
            id="resource-title"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                title: event.currentTarget.value,
              }))
            }
            placeholder="MELS 101 lecture notes"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resource-year">Academic year</Label>
          <Input
            id="resource-year"
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
          <Label htmlFor="resource-type">Type</Label>
          <Select onValueChange={updateType} value={values.type}>
            <SelectTrigger id="resource-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resource-status">Status</Label>
          <Select onValueChange={updateStatus} value={values.status}>
            <SelectTrigger id="resource-status">
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
          <Label htmlFor="resource-level">Level</Label>
          <Select onValueChange={updateLevel} value={values.level}>
            <SelectTrigger id="resource-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resource-semester">Semester</Label>
          <Select onValueChange={updateSemester} value={values.semester}>
            <SelectTrigger id="resource-semester">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEMESTER_TERM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resource-course">Course</Label>
        <Select
          onValueChange={updateCourse}
          value={values.courseId === null ? "none" : String(values.courseId)}
        >
          <SelectTrigger id="resource-course">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No course</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={String(course.id)}>
                {course.code} · {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resource-description">Description</Label>
        <Textarea
          id="resource-description"
          maxLength={1_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.currentTarget.value,
            }))
          }
          placeholder="Short note for students"
          value={values.description}
        />
      </div>

      {mode === "create" ? (
        <StorageUploadField
          disabled={isPending}
          endpoint="resourceFile"
          label="Resource file"
          onChange={(file) =>
            setValues((current) => ({
              ...current,
              file,
            }))
          }
          value={values.file}
        />
      ) : resource ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-sm font-medium">Current file</p>
          <a
            className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
            href={resource.file.publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-3.5" />
            {resource.file.originalFilename}
          </a>
        </div>
      ) : null}

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create resource" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteResourceDialog({
  isPending,
  onDelete,
  onOpenChange,
  resource,
}: {
  isPending: boolean;
  onDelete: (resourceId: number) => void;
  onOpenChange: (open: boolean) => void;
  resource: ResourceRow | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={resource !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete resource</DialogTitle>
          <DialogDescription>
            {resource
              ? `${resource.title} and its uploaded file will be removed.`
              : "This resource and its uploaded file will be removed."}
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
            disabled={!resource || isPending}
            onClick={() => {
              if (resource) onDelete(resource.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete resource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResourceStatusBadge({ status }: { status: ContentStatus }) {
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

async function fetchAdminResources() {
  const response = await fetch("/api/admin/resources", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load resources.",
    );
  }

  return adminResourcesResponseSchema.parse(body);
}

async function createAdminResource(
  input: CreateResourceInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/resources", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Resource creation failed.");
}

async function updateAdminResource(
  input: UpdateResourceInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/resources", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Resource update failed.");
}

async function deleteAdminResource({
  resourceId,
}: {
  resourceId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/resources", {
    body: JSON.stringify({ resourceId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Resource deletion failed.");
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

function getInitialResourceFormValues(
  resource?: ResourceRow,
): ResourceFormValues {
  return {
    title: resource?.title ?? "",
    description: resource?.description ?? "",
    type: resource?.type ?? "lecture_slide",
    level: resource?.level ?? "level100",
    semester: resource?.semester ?? "first",
    academicYear: resource?.academicYear ?? "",
    courseId: resource?.course?.id ?? null,
    status: resource?.status ?? "draft",
    file: resource
      ? {
          id: resource.file.id,
          objectKey: resource.file.objectKey,
          publicUrl: resource.file.publicUrl,
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

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}
