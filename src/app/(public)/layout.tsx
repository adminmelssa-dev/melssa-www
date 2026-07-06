import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CampaignPromo } from "@/components/campaign/campaign-promo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CampaignPromo />
    </div>
  );
}
