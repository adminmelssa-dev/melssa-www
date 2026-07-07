import { BadgeDollarSign, Inbox, Send, Workflow } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FundraisingAdminTables } from "@/modules/fundraising/components/fundraising-admin-tables";
import type {
  FundraisingCampaignRow,
  FundraisingInquiryRow,
} from "@/modules/fundraising/contracts";
import {
  getSerializedFundraisingCampaigns,
  getSerializedFundraisingInquiries,
} from "@/modules/fundraising/queries";
import { requirePermission } from "@/server/auth/guards";

interface FundraisingStats {
  campaigns: number;
  publishedCampaigns: number;
  inquiries: number;
  openInquiries: number;
}

export async function FundraisingAdminPage() {
  const session = await requirePermission({
    resource: "fundraising",
    action: "read",
  });
  const [campaigns, inquiries] = await Promise.all([
    getSerializedFundraisingCampaigns(),
    getSerializedFundraisingInquiries(),
  ]);
  const stats = getFundraisingStats(campaigns, inquiries);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "fundraising",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "fundraising",
      action: "update",
    }),
    canDelete: session.permissions.has({
      resource: "fundraising",
      action: "delete",
    }),
    canPublish: session.permissions.has({
      resource: "fundraising",
      action: "publish",
    }),
    canRespond: session.permissions.has({
      resource: "fundraising",
      action: "respond",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Finance Desk</p>
        <h1 className="font-heading text-2xl font-black">Fundraising</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BadgeDollarSign}
          label="Campaigns"
          value={stats.campaigns}
        />
        <StatCard
          icon={Send}
          label="Published"
          value={stats.publishedCampaigns}
        />
        <StatCard icon={Inbox} label="Inquiries" value={stats.inquiries} />
        <StatCard
          icon={Workflow}
          label="Open inquiries"
          value={stats.openInquiries}
        />
      </section>

      <FundraisingAdminTables
        campaigns={campaigns}
        inquiries={inquiries}
        permissions={permissions}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof BadgeDollarSign;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <CardTitle className="text-2xl font-black">{value}</CardTitle>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardHeader>
    </Card>
  );
}

function getFundraisingStats(
  campaigns: FundraisingCampaignRow[],
  inquiries: FundraisingInquiryRow[],
): FundraisingStats {
  return {
    campaigns: campaigns.length,
    publishedCampaigns: campaigns.filter(
      (campaign) => campaign.status === "published",
    ).length,
    inquiries: inquiries.length,
    openInquiries: inquiries.filter(
      (inquiry) =>
        inquiry.status === "new" || inquiry.status === "reviewing",
    ).length,
  };
}
