import {
  Image,
  Images,
  Sparkles,
  Tags,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GalleryTable } from "@/modules/gallery/components/gallery-table";
import {
  getGalleryAdminStats,
  getSerializedGalleryItemPage,
} from "@/modules/gallery/queries";
import { parseDataTableQuery } from "@/lib/data-table-query";
import { requirePermission } from "@/server/auth/guards";

export async function GalleryAdminPage() {
  const session = await requirePermission({
    resource: "gallery",
    action: "read",
  });
  const [galleryPage, stats] = await Promise.all([
    getSerializedGalleryItemPage(parseDataTableQuery(new URLSearchParams())),
    getGalleryAdminStats(),
  ]);
  const permissions = {
    canCreate: session.permissions.has({
      resource: "gallery",
      action: "create",
    }),
    canUpdate: session.permissions.has({
      resource: "gallery",
      action: "update",
    }),
    canDelete: session.permissions.has({
      resource: "gallery",
      action: "delete",
    }),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Media archive</p>
        <h1 className="font-heading text-2xl font-black">Gallery</h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Images} label="Images" value={stats.totalItems} />
        <StatCard icon={Sparkles} label="Featured" value={stats.featuredItems} />
        <StatCard icon={Tags} label="Categorized" value={stats.typedItems} />
      </section>

      <GalleryTable
        initialGalleryItems={galleryPage.items}
        initialMeta={galleryPage.meta}
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
  icon: typeof Image;
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
