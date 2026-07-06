import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { resolveUserRole } from "@/modules/auth/roles";
import { requireAuth } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const role = resolveUserRole(session.user.role);

  return (
    <DashboardShell
      role={role}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}
