import { Archive, FileText, Send, Workflow } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinanceDocumentsTable } from "@/modules/finance/components/finance-documents-table";
import type { FinanceDocumentRow } from "@/modules/finance/contracts";
import { getSerializedFinanceDocuments } from "@/modules/finance/queries";
import { requirePermission } from "@/server/auth/guards";

interface FinanceStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export async function FinanceAdminPage() {
  const session = await requirePermission({ resource: "finance", action: "read" });
  const documents = await getSerializedFinanceDocuments();
  const stats = getFinanceStats(documents);
  const permissions = {
    canCreate: session.permissions.has({ resource: "finance", action: "create" }),
    canUpdate: session.permissions.has({ resource: "finance", action: "update" }),
    canDelete: session.permissions.has({ resource: "finance", action: "delete" }),
    canPublish: session.permissions.has({
      resource: "finance",
      action: "publish",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Finance Desk</p>
        <h1 className="font-heading text-2xl font-black">Finance</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Documents" value={stats.total} />
        <StatCard icon={Send} label="Published" value={stats.published} />
        <StatCard icon={Workflow} label="Drafts" value={stats.draft} />
        <StatCard icon={Archive} label="Archived" value={stats.archived} />
      </section>

      <FinanceDocumentsTable documents={documents} permissions={permissions} />
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
  icon: typeof FileText;
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

function getFinanceStats(documents: FinanceDocumentRow[]): FinanceStats {
  return {
    total: documents.length,
    published: documents.filter((document) => document.status === "published")
      .length,
    draft: documents.filter((document) => document.status === "draft").length,
    archived: documents.filter((document) => document.status === "archived")
      .length,
  };
}
