import {
  BookOpen,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CoursesTable } from "@/modules/academics/components/courses-table";
import type { CourseRow } from "@/modules/academics/contracts";
import { getSerializedCourses } from "@/modules/academics/queries";
import { requirePermission } from "@/server/auth/guards";

interface CoursesAdminStats {
  totalCourses: number;
  levelGroups: number;
  linkedResources: number;
  lecturerAssignments: number;
}

export async function CoursesAdminPage() {
  const session = await requirePermission({ resource: "course", action: "read" });
  const courses = await getSerializedCourses();
  const stats = getCoursesAdminStats(courses);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "course",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "course",
      action: "update",
    }),
    canDelete: session.permissions.has({
      resource: "course",
      action: "delete",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Academic catalog</p>
        <h1 className="font-heading text-2xl font-black">Courses</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={stats.totalCourses}
        />
        <StatCard
          icon={GraduationCap}
          label="Levels represented"
          value={stats.levelGroups}
        />
        <StatCard
          icon={FileText}
          label="Linked resources"
          value={stats.linkedResources}
        />
        <StatCard
          icon={Users}
          label="Lecturer assignments"
          value={stats.lecturerAssignments}
        />
      </section>

      <CoursesTable initialCourses={courses} permissions={permissions} />
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
  icon: typeof BookOpen;
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

function getCoursesAdminStats(courses: CourseRow[]): CoursesAdminStats {
  return {
    totalCourses: courses.length,
    levelGroups: new Set(courses.map((course) => course.level)).size,
    linkedResources: courses.reduce(
      (total, course) => total + course.resourceCount,
      0,
    ),
    lecturerAssignments: courses.reduce(
      (total, course) => total + course.lecturerCount,
      0,
    ),
  };
}
