import type { Metadata } from "next";
import { SpotlightsPublicPage } from "@/modules/spotlights/components/spotlights-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Student Spotlight",
  description:
    "MELSSA student spotlight stories celebrating academic excellence, service, leadership, and community impact.",
  alternates: {
    canonical: "/spotlight",
  },
};

export default function PublicSpotlightPage() {
  return <SpotlightsPublicPage />;
}
