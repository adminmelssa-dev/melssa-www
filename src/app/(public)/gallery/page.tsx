import type { Metadata } from "next";
import { GalleryPublicPage } from "@/modules/gallery/components/gallery-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Gallery",
  description:
    "MELSSA photo gallery featuring seminars, outreach programs, congresses, health screenings, and student moments.",
  alternates: {
    canonical: "/gallery",
  },
};

export default function PublicGalleryPage() {
  return <GalleryPublicPage />;
}
