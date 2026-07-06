"use client";

import * as React from "react";
import {
  Edit3,
  GraduationCap,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  User,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CourseRow } from "@/modules/academics/contracts";
import {
  adminLecturersResponseSchema,
  createLecturerInputSchema,
  type CreateLecturerInput,
  type LecturerRow,
  type UpdateLecturerInput,
} from "@/modules/lecturers/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminLecturersQueryKey = ["admin-lecturers"];

const contactFilterOptions = [
  { label: "Has email", value: "has_email" },
  { label: "Missing email", value: "missing_email" },
];

const photoFilterOptions = [
  { label: "Has photo", value: "has_photo" },
  { label: "Missing photo", value: "missing_photo" },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface LecturerFormValues {
  name: string;
  title: string;
  email: string;
  phone: string;
  officeLocation: string;
  officeHours: string;
  photo: UploadedStorageObject | null;
  courseIds: number[];
}

interface LecturersTableProps {
  initialLecturers: LecturerRow[];
  initialCourses: CourseRow[];
  permissions: LecturerTablePermissions;
}

interface LecturerTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function LecturersTable({
  initialCourses,
  initialLecturers,
  permissions,
}: LecturersTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingLecturer, setEditingLecturer] =
    React.useState<LecturerRow | null>(null);
  const [deletingLecturer, setDeletingLecturer] =
    React.useState<LecturerRow | null>(null);
  const queryClient = useQueryClient();

  const lecturersQuery = useQuery({
    queryKey: adminLecturersQueryKey,
    queryFn: fetchAdminLecturers,
    initialData: { lecturers: initialLecturers },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminLecturer,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingLecturer(null);
      await queryClient.invalidateQueries({ queryKey: adminLecturersQueryKey });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingLecturer,
        onEdit: setEditingLecturer,
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
            New lecturer
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={lecturersQuery.data.lecturers}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <User className="size-5" />
            </span>
            <p className="text-sm font-medium">No lecturers found</p>
            <p className="text-xs text-muted-foreground">
              Lecturer profiles will appear here.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "contactStatus",
            options: contactFilterOptions,
            title: "Contact",
          },
          {
            columnId: "photoStatus",
            options: photoFilterOptions,
            title: "Photo",
          },
        ]}
        getRowId={(lecturer) => String(lecturer.id)}
        initialColumnVisibility={{
          contactStatus: false,
          courseSearch: false,
          photoStatus: false,
        }}
        searchPlaceholder="Search by name, email, or course..."
      />

      <LecturerDialog
        courses={initialCourses}
        key="create-lecturer"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      {editingLecturer && permissions.canUpdate ? (
        <LecturerDialog
          courses={initialCourses}
          key={`edit-${editingLecturer.id}`}
          lecturer={editingLecturer}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingLecturer(null);
          }}
          open
        />
      ) : null}

      <DeleteLecturerDialog
        isPending={deleteMutation.isPending}
        lecturer={deletingLecturer}
        onDelete={(lecturerId) => deleteMutation.mutate({ lecturerId })}
        onOpenChange={(open) => {
          if (!open) setDeletingLecturer(null);
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
  onDelete: (lecturer: LecturerRow) => void;
  onEdit: (lecturer: LecturerRow) => void;
  permissions: LecturerTablePermissions;
}): ColumnDef<LecturerRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lecturer" />
      ),
      cell: ({ row }) => {
        const lecturer = row.original;

        return (
          <div className="flex min-w-60 items-center gap-3">
            <Avatar size="lg">
              {lecturer.photo ? (
                <AvatarImage alt={lecturer.name} src={lecturer.photo.publicUrl} />
              ) : null}
              <AvatarFallback>{getInitials(lecturer.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{lecturer.name}</p>
              {lecturer.title ? (
                <p className="truncate text-muted-foreground">{lecturer.title}</p>
              ) : null}
            </div>
          </div>
        );
      },
      meta: { label: "Lecturer", className: "min-w-64" },
    },
    {
      id: "contact",
      accessorFn: (row) => [row.email, row.phone].filter(Boolean).join(" "),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.email ? (
            <a
              className="flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
              href={`mailto:${row.original.email}`}
            >
              <Mail className="size-3.5" />
              {row.original.email}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No email</p>
          )}
          {row.original.phone ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {row.original.phone}
            </p>
          ) : null}
        </div>
      ),
      meta: { label: "Contact", className: "min-w-56" },
    },
    {
      id: "courses",
      accessorFn: (row) =>
        row.courses.map((course) => `${course.code} ${course.title}`).join(" "),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Courses" />
      ),
      cell: ({ row }) =>
        row.original.courses.length > 0 ? (
          <div className="flex max-w-lg flex-wrap gap-1">
            {row.original.courses.map((course) => (
              <Badge key={course.id} variant="outline">
                {course.code}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
      meta: { label: "Courses", className: "min-w-56" },
    },
    {
      id: "office",
      accessorFn: (row) => [row.officeLocation, row.officeHours].filter(Boolean).join(" "),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Office" />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <p>{row.original.officeLocation ?? "No location"}</p>
          {row.original.officeHours ? (
            <p className="text-muted-foreground">{row.original.officeHours}</p>
          ) : null}
        </div>
      ),
      meta: { label: "Office", className: "min-w-48" },
    },
    {
      id: "contactStatus",
      accessorFn: (row) => (row.email ? "has_email" : "missing_email"),
      filterFn: stringArrayFilter,
      header: "Contact Status",
      meta: { label: "Contact Status" },
    },
    {
      id: "photoStatus",
      accessorFn: (row) => (row.photo ? "has_photo" : "missing_photo"),
      filterFn: stringArrayFilter,
      header: "Photo Status",
      meta: { label: "Photo Status" },
    },
    {
      id: "courseSearch",
      accessorFn: (row) =>
        row.courses.map((course) => `${course.code} ${course.title}`).join(" "),
      header: "Course Search",
      meta: { label: "Course Search" },
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
        <LecturerRowActions
          lecturer={row.original}
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function LecturerRowActions({
  lecturer,
  onDelete,
  onEdit,
  permissions,
}: {
  lecturer: LecturerRow;
  onDelete: (lecturer: LecturerRow) => void;
  onEdit: (lecturer: LecturerRow) => void;
  permissions: LecturerTablePermissions;
}) {
  if (!permissions.canUpdate && !permissions.canDelete) return null;

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
            <DropdownMenuItem onSelect={() => onEdit(lecturer)}>
              <Edit3 className="size-4" />
              Edit lecturer
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(lecturer)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete lecturer
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function LecturerDialog({
  courses,
  lecturer,
  mode,
  onOpenChange,
  open,
}: {
  courses: CourseRow[];
  lecturer?: LecturerRow;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New lecturer" : "Edit lecturer"}
          </DialogTitle>
          <DialogDescription>
            Lecturer profiles power the public directory and course pages.
          </DialogDescription>
        </DialogHeader>
        <LecturerForm
          courses={courses}
          lecturer={lecturer}
          mode={mode}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function LecturerForm({
  courses,
  lecturer,
  mode,
  onSaved,
}: {
  courses: CourseRow[];
  lecturer?: LecturerRow;
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<LecturerFormValues>(() =>
    getInitialLecturerFormValues(lecturer),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminLecturer,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminLecturersQueryKey });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminLecturer,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminLecturersQueryKey });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitLecturer(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const parsedInput = createLecturerInputSchema.safeParse({
      name: values.name,
      title: values.title,
      email: values.email,
      phone: values.phone,
      officeLocation: values.officeLocation,
      officeHours: values.officeHours,
      photoStorageObjectId: values.photo?.id ?? null,
      courseIds: values.courseIds,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the lecturer details.",
      );
      return;
    }

    if (mode === "create") {
      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!lecturer) {
      toast.error("Lecturer not found.");
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      lecturerId: lecturer.id,
    });
  }

  return (
    <form className="space-y-5" onSubmit={submitLecturer}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lecturer-name">Name</Label>
          <Input
            id="lecturer-name"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                name: event.currentTarget.value,
              }))
            }
            placeholder="Dr. Jane Doe"
            value={values.name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lecturer-title">Title</Label>
          <Input
            id="lecturer-title"
            maxLength={120}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                title: event.currentTarget.value,
              }))
            }
            placeholder="Senior Lecturer"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lecturer-email">Email</Label>
          <Input
            id="lecturer-email"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                email: event.currentTarget.value,
              }))
            }
            placeholder="lecturer@example.edu"
            type="email"
            value={values.email}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lecturer-phone">Phone</Label>
          <Input
            id="lecturer-phone"
            maxLength={80}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                phone: event.currentTarget.value,
              }))
            }
            placeholder="+233..."
            value={values.phone}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lecturer-office">Office location</Label>
          <Input
            id="lecturer-office"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                officeLocation: event.currentTarget.value,
              }))
            }
            placeholder="Department block, Room 2"
            value={values.officeLocation}
          />
        </div>
        <CoursePicker
          courses={courses}
          onChange={(courseIds) =>
            setValues((current) => ({
              ...current,
              courseIds,
            }))
          }
          selectedCourseIds={values.courseIds}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lecturer-hours">Office hours</Label>
        <Textarea
          id="lecturer-hours"
          maxLength={1_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              officeHours: event.currentTarget.value,
            }))
          }
          placeholder="Mondays, 10:00 AM - 12:00 PM"
          value={values.officeHours}
        />
      </div>

      <StorageUploadField
        disabled={isPending}
        endpoint="lecturerPhoto"
        label="Profile photo"
        onChange={(photo) =>
          setValues((current) => ({
            ...current,
            photo,
          }))
        }
        value={values.photo}
      />

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create lecturer" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CoursePicker({
  courses,
  onChange,
  selectedCourseIds,
}: {
  courses: CourseRow[];
  onChange: (courseIds: number[]) => void;
  selectedCourseIds: number[];
}) {
  const selectedCourseIdSet = new Set(selectedCourseIds);
  const selectedCourses = courses.filter((course) =>
    selectedCourseIdSet.has(course.id),
  );

  function toggleCourse(courseId: number): void {
    if (selectedCourseIdSet.has(courseId)) {
      onChange(selectedCourseIds.filter((id) => id !== courseId));
      return;
    }

    onChange([...selectedCourseIds, courseId]);
  }

  return (
    <div className="space-y-2">
      <Label>Courses taught</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full justify-between" type="button" variant="outline">
            <span className="truncate">
              {selectedCourses.length > 0
                ? `${selectedCourses.length} selected`
                : "Assign courses"}
            </span>
            <GraduationCap className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-72 w-72 overflow-y-auto">
          {courses.length > 0 ? (
            courses.map((course) => (
              <DropdownMenuCheckboxItem
                checked={selectedCourseIdSet.has(course.id)}
                key={course.id}
                onCheckedChange={() => toggleCourse(course.id)}
              >
                <span className="truncate">
                  {course.code} · {course.title}
                </span>
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No courses available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DeleteLecturerDialog({
  isPending,
  lecturer,
  onDelete,
  onOpenChange,
}: {
  isPending: boolean;
  lecturer: LecturerRow | null;
  onDelete: (lecturerId: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={lecturer !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete lecturer</DialogTitle>
          <DialogDescription>
            {lecturer
              ? `${lecturer.name} will be removed from the lecturer directory.`
              : "This lecturer will be removed from the lecturer directory."}
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
            disabled={!lecturer || isPending}
            onClick={() => {
              if (lecturer) onDelete(lecturer.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete lecturer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function fetchAdminLecturers() {
  const response = await fetch("/api/admin/lecturers", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load lecturers.",
    );
  }

  return adminLecturersResponseSchema.parse(body);
}

async function createAdminLecturer(
  input: CreateLecturerInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/lecturers", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Lecturer creation failed.");
}

async function updateAdminLecturer(
  input: UpdateLecturerInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/lecturers", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Lecturer update failed.");
}

async function deleteAdminLecturer({
  lecturerId,
}: {
  lecturerId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/lecturers", {
    body: JSON.stringify({ lecturerId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Lecturer deletion failed.");
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

function getInitialLecturerFormValues(
  lecturer?: LecturerRow,
): LecturerFormValues {
  return {
    name: lecturer?.name ?? "",
    title: lecturer?.title ?? "",
    email: lecturer?.email ?? "",
    phone: lecturer?.phone ?? "",
    officeLocation: lecturer?.officeLocation ?? "",
    officeHours: lecturer?.officeHours ?? "",
    photo: lecturer?.photo
      ? {
          id: lecturer.photo.id,
          objectKey: lecturer.photo.objectKey,
          publicUrl: lecturer.photo.publicUrl,
        }
      : null,
    courseIds: lecturer?.courses.map((course) => course.id) ?? [],
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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
