import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { ScholarshipsAdminPage } from "@/modules/scholarships/components/scholarships-admin-page";

export default function ScholarshipsDashboardPage() {
  if (!env.SCHOLARSHIPS_ENABLED) notFound();

  return <ScholarshipsAdminPage />;
}
