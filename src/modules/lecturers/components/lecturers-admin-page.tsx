import {
  BookOpen,
  Image,
  Mail,
  Users,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSerializedCourses } from "@/modules/academics/queries";
import { LecturersTable } from "@/modules/lecturers/components/lecturers-table";
import type { LecturerRow } from "@/modules/lecturers/contracts";
import { getSerializedLecturers } from "@/modules/lecturers/queries";
import { requirePermission } from "@/server/auth/guards";

interface LecturersAdminStats {
  totalLecturers: number;
  withEmail: number;
  withPhoto: number;
  courseAssignments: number;
}

export async function LecturersAdminPage() {
  const session = await requirePermission({
    resource: "lecturer",
    action: "read",
  });
  const [lecturers, courses] = await Promise.all([
    getSerializedLecturers(),
    getSerializedCourses(),
  ]);
  const stats = getLecturersAdminStats(lecturers);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "lecturer",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "lecturer",
      action: "update",
    }),
    canDelete: session.permissions.has({
      resource: "lecturer",
      action: "delete",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Academic directory</p>
        <h1 className="font-heading text-2xl font-black">Lecturers</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Lecturers" value={stats.totalLecturers} />
        <StatCard icon={Mail} label="Email contacts" value={stats.withEmail} />
        <StatCard icon={Image} label="Profile photos" value={stats.withPhoto} />
        <StatCard
          icon={BookOpen}
          label="Course assignments"
          value={stats.courseAssignments}
        />
      </section>

      <LecturersTable
        initialCourses={courses}
        initialLecturers={lecturers}
        permissions={permissions}
      />
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
  icon: typeof Users;
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

function getLecturersAdminStats(
  lecturers: LecturerRow[],
): LecturersAdminStats {
  return {
    totalLecturers: lecturers.length,
    withEmail: lecturers.filter((lecturer) => lecturer.email !== null).length,
    withPhoto: lecturers.filter((lecturer) => lecturer.photo !== null).length,
    courseAssignments: lecturers.reduce(
      (total, lecturer) => total + lecturer.courses.length,
      0,
    ),
  };
}
