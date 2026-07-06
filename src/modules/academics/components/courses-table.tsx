"use client";

import * as React from "react";
import {
  BookOpen,
  Edit3,
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
  adminCoursesResponseSchema,
  createCourseInputSchema,
  semesterTermSchema,
  type AcademicLevel,
  type CourseRow,
  type CreateCourseInput,
  type SemesterTerm,
  type UpdateCourseInput,
} from "@/modules/academics/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";

const adminCoursesQueryKey = ["admin-courses"];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface CourseFormValues {
  code: string;
  title: string;
  level: AcademicLevel;
  semester: SemesterTerm;
  description: string;
}

interface CoursesTableProps {
  initialCourses: CourseRow[];
  permissions: CourseTablePermissions;
}

interface CourseTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function CoursesTable({
  initialCourses,
  permissions,
}: CoursesTableProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] =
    React.useState<CourseRow | null>(null);
  const [deletingCourse, setDeletingCourse] =
    React.useState<CourseRow | null>(null);
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: adminCoursesQueryKey,
    queryFn: fetchAdminCourses,
    initialData: { courses: initialCourses },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCourse,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingCourse(null);
      await queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
    },
  });

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: setDeletingCourse,
        onEdit: setEditingCourse,
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
            New course
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={coursesQuery.data.courses}
        emptyState={
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
            <BookOpenEmptyIcon />
            <p className="text-sm font-medium">No courses found</p>
            <p className="text-xs text-muted-foreground">
              Course records will appear here.
            </p>
          </div>
        }
        filters={[
          {
            columnId: "level",
            title: "Level",
            options: ACADEMIC_LEVEL_OPTIONS,
          },
          {
            columnId: "semester",
            title: "Semester",
            options: SEMESTER_TERM_OPTIONS,
          },
        ]}
        getRowId={(course) => String(course.id)}
        initialColumnVisibility={{ title: false }}
        searchPlaceholder="Search by code or title..."
      />

      <CourseDialog
        key="create-course"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      {editingCourse && permissions.canUpdate ? (
        <CourseDialog
          course={editingCourse}
          key={`edit-${editingCourse.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingCourse(null);
          }}
          open
        />
      ) : null}

      <DeleteCourseDialog
        course={deletingCourse}
        isPending={deleteMutation.isPending}
        onDelete={(courseId) => deleteMutation.mutate({ courseId })}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
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
  onDelete: (course: CourseRow) => void;
  onEdit: (course: CourseRow) => void;
  permissions: CourseTablePermissions;
}): ColumnDef<CourseRow>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Course" />
      ),
      cell: ({ row }) => {
        const course = row.original;

        return (
          <div className="min-w-56 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{course.code}</Badge>
              <span className="font-medium">{course.title}</span>
            </div>
            {course.description ? (
              <p className="max-w-xl truncate text-muted-foreground">
                {course.description}
              </p>
            ) : null}
          </div>
        );
      },
      meta: { label: "Course", className: "min-w-64" },
    },
    {
      accessorKey: "title",
      header: "Title",
      meta: { label: "Title" },
    },
    {
      accessorKey: "level",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Level" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          {ACADEMIC_LEVEL_LABELS[row.original.level]}
        </Badge>
      ),
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
      id: "usage",
      accessorFn: (row) => row.resourceCount + row.lecturerCount,
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Usage" />
      ),
      cell: ({ row }) => (
        <div className="space-y-1 text-sm">
          <p>{row.original.resourceCount} resources</p>
          <p className="text-muted-foreground">
            {row.original.lecturerCount} lecturers
          </p>
        </div>
      ),
      meta: { label: "Usage" },
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
        <CourseRowActions
          course={row.original}
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function CourseRowActions({
  course,
  onDelete,
  onEdit,
  permissions,
}: {
  course: CourseRow;
  onDelete: (course: CourseRow) => void;
  onEdit: (course: CourseRow) => void;
  permissions: CourseTablePermissions;
}) {
  const canDelete = getCourseUsageCount(course) === 0;
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
            <DropdownMenuItem onSelect={() => onEdit(course)}>
              <Edit3 className="size-4" />
              Edit course
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canDelete}
                onSelect={() => onDelete(course)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete course
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function CourseDialog({
  course,
  mode,
  onOpenChange,
  open,
}: {
  course?: CourseRow;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New course" : "Edit course"}
          </DialogTitle>
          <DialogDescription>
            Course records connect resources, lecturers, levels, and semesters.
          </DialogDescription>
        </DialogHeader>
        <CourseForm
          course={course}
          mode={mode}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CourseForm({
  course,
  mode,
  onSaved,
}: {
  course?: CourseRow;
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<CourseFormValues>(() =>
    getInitialCourseFormValues(course),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminCourse,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminCourse,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitCourse(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsedInput = createCourseInputSchema.safeParse(values);

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the course details.",
      );
      return;
    }

    if (mode === "create") {
      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!course) {
      toast.error("Course not found.");
      return;
    }

    updateMutation.mutate({
      ...parsedInput.data,
      courseId: course.id,
    });
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

  return (
    <form className="space-y-5" onSubmit={submitCourse}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course-code">Code</Label>
          <Input
            id="course-code"
            maxLength={40}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                code: event.currentTarget.value,
              }))
            }
            placeholder="MELS 101"
            value={values.code}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-title">Title</Label>
          <Input
            id="course-title"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                title: event.currentTarget.value,
              }))
            }
            placeholder="Human Anatomy"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-level">Level</Label>
          <Select onValueChange={updateLevel} value={values.level}>
            <SelectTrigger id="course-level">
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
          <Label htmlFor="course-semester">Semester</Label>
          <Select onValueChange={updateSemester} value={values.semester}>
            <SelectTrigger id="course-semester">
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
        <Label htmlFor="course-description">Description</Label>
        <Textarea
          id="course-description"
          maxLength={1_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.currentTarget.value,
            }))
          }
          placeholder="Short catalog note"
          value={values.description}
        />
      </div>

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create course" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteCourseDialog({
  course,
  isPending,
  onDelete,
  onOpenChange,
}: {
  course: CourseRow | null;
  isPending: boolean;
  onDelete: (courseId: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={course !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete course</DialogTitle>
          <DialogDescription>
            {course
              ? `${course.code}: ${course.title} will be removed from the academic catalog.`
              : "This course will be removed from the academic catalog."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => course && onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!course || isPending}
            onClick={() => {
              if (course) onDelete(course.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function fetchAdminCourses() {
  const response = await fetch("/api/admin/courses", {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success ? parsedError.data.message : "Failed to load courses.",
    );
  }

  return adminCoursesResponseSchema.parse(body);
}

async function createAdminCourse(
  input: CreateCourseInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/courses", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Course creation failed.");
}

async function updateAdminCourse(
  input: UpdateCourseInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/courses", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Course update failed.");
}

async function deleteAdminCourse({
  courseId,
}: {
  courseId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/courses", {
    body: JSON.stringify({ courseId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Course deletion failed.");
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

function getInitialCourseFormValues(course?: CourseRow): CourseFormValues {
  return {
    code: course?.code ?? "",
    title: course?.title ?? "",
    level: course?.level ?? "level100",
    semester: course?.semester ?? "first",
    description: course?.description ?? "",
  };
}

function getCourseUsageCount(course: CourseRow): number {
  return course.resourceCount + course.lecturerCount;
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

function BookOpenEmptyIcon() {
  return (
    <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
      <BookOpen className="size-5" />
    </div>
  );
}
