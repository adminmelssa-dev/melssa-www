import type { Metadata } from "next";
import { FundraisingPublicPage } from "@/modules/fundraising/components/fundraising-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Fundraising and Sponsorship",
  description:
    "Support MELSSA campaigns, view external payment instructions, and send sponsorship inquiries.",
  alternates: {
    canonical: "/fundraising",
  },
};

export default function FundraisingPage() {
  return <FundraisingPublicPage />;
}
