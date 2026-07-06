import type { Metadata } from "next";
import { ResourcesPublicPage } from "@/modules/resources/components/resources-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Resources",
  description:
    "Published MELSSA academic resources, lecture slides, past questions, and reference materials organized by course and level.",
  alternates: {
    canonical: "/resources",
  },
};

export default function PublicResourcesPage() {
  return <ResourcesPublicPage />;
}
