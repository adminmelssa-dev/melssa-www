import type { Metadata } from "next";
import { AnnouncementsPublicPage } from "@/modules/announcements/components/announcements-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Announcements",
  description:
    "Official MELSSA announcements, academic updates, welfare notices, and student association communications.",
  alternates: {
    canonical: "/announcements",
  },
};

export default function PublicAnnouncementsPage() {
  return <AnnouncementsPublicPage />;
}
