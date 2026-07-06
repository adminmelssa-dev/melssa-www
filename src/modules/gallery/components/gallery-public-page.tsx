import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GALLERY_ITEM_TYPE_LABELS } from "@/modules/gallery/contracts";
import { getSerializedGalleryItems } from "@/modules/gallery/queries";

export async function GalleryPublicPage() {
  const galleryItems = await getSerializedGalleryItems();

  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Media archive"
        title="Gallery"
        description="Moments from events, seminars, health screenings, congress and outreach."
      />

      {galleryItems.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {galleryItems.map((item) => (
            <figure key={item.id} className="group">
              <div className="relative aspect-[4/3] overflow-hidden border border-hairline">
                <Image
                  alt={item.title}
                  className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  src={item.image.publicUrl}
                />
              </div>
              <figcaption className="mt-3">
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
                  {GALLERY_ITEM_TYPE_LABELS[item.type]}
                  {item.isFeatured ? (
                    <span className="text-foreground/40">· Featured</span>
                  ) : null}
                </div>
                <div className="mt-1 text-sm font-medium leading-snug text-foreground">
                  {item.title}
                </div>
                {item.caption ? (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/55">
                    {item.caption}
                  </p>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            icon={ImageIcon}
            title="No gallery items yet"
            description="Photos from MELSSA events will appear here."
          />
        </div>
      )}
    </div>
  );
}
