import type { Metadata } from "next";
import { ManifestoHolding } from "@/components/campaign/manifesto-holding";

export const metadata: Metadata = {
  title: "Manifesto — Kirstin Austin Ankrah",
  description:
    "Kirstin Austin Ankrah, candidate for Financial Officer of MELSSA, Accra Technical University. A refreshed manifesto is on the way.",
};

// Holding state until the Financial Officer manifesto is written. To restore
// the full spread, import { ManifestoPage } and render it here once the
// refreshed content lands in manifesto-content.ts.
export default function Manifesto() {
  return <ManifestoHolding />;
}
