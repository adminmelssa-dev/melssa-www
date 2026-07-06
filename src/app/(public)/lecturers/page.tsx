import type { Metadata } from "next";
import { LecturersPublicPage } from "@/modules/lecturers/components/lecturers-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Lecturers",
  description:
    "MELSSA lecturer directory with academic contacts, course assignments, office details, and student-facing profiles.",
  alternates: {
    canonical: "/lecturers",
  },
};

export default function PublicLecturersPage() {
  return <LecturersPublicPage />;
}
