import type { Metadata } from "next";
import { FinancePublicPage } from "@/modules/finance/components/finance-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Finance Desk",
  description:
    "Published MELSSA finance reports, annual accountability documents, and programme budgets.",
  alternates: {
    canonical: "/finance",
  },
};

export default function FinancePage() {
  return <FinancePublicPage />;
}
