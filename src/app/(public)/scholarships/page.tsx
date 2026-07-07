import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { ScholarshipsPublicPage } from "@/modules/scholarships/components/scholarships-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Scholarships",
  description:
    "Published MELSSA scholarship opportunities, eligibility details, deadlines, and application links.",
  alternates: {
    canonical: "/scholarships",
  },
};

export default function ScholarshipsPage() {
  if (!env.SCHOLARSHIPS_ENABLED) notFound();

  return <ScholarshipsPublicPage />;
}
