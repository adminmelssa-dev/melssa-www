import type { Metadata } from "next";
import { ConcernsPublicPage } from "@/modules/concerns/components/concerns-public-page";

export const metadata: Metadata = {
  title: "Anonymous Concerns",
  description:
    "Submit anonymous academic, welfare, finance, facilities, or safety concerns to MELSSA leadership.",
  alternates: {
    canonical: "/concerns",
  },
};

export default function PublicConcernsPage() {
  return <ConcernsPublicPage />;
}
