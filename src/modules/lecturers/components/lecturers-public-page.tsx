import Image from "next/image";
import { Clock, Mail, MapPin, Phone, Users } from "lucide-react";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getSerializedLecturers } from "@/modules/lecturers/queries";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : ""))
      .toUpperCase() || "?"
  );
}

export async function LecturersPublicPage() {
  const lecturers = await getSerializedLecturers();

  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Academic contacts"
        title="Lecturers"
        description="Contacts, office hours and the courses each lecturer teaches."
      />

      {lecturers.length > 0 ? (
        <div className="mt-2 grid gap-x-12 sm:grid-cols-2">
          {lecturers.map((lecturer) => (
            <article
              key={lecturer.id}
              className="flex gap-5 border-b border-hairline py-9"
            >
              {lecturer.photo ? (
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-hairline">
                  <Image
                    alt={lecturer.name}
                    className="object-cover"
                    fill
                    sizes="64px"
                    src={lecturer.photo.publicUrl}
                  />
                </div>
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold text-cream">
                  {initials(lecturer.name)}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-xl leading-tight">{lecturer.name}</h2>
                {lecturer.title ? (
                  <p className="mt-1 text-[13px] font-medium text-gold-ink">
                    {lecturer.title}
                  </p>
                ) : null}

                <div className="mt-4 space-y-2 text-[13.5px] text-foreground/70">
                  {lecturer.email ? (
                    <a
                      className="flex items-center gap-2.5 transition-colors hover:text-gold-ink"
                      href={`mailto:${lecturer.email}`}
                    >
                      <Mail className="size-4 shrink-0 text-foreground/40" />
                      <span className="truncate">{lecturer.email}</span>
                    </a>
                  ) : null}
                  {lecturer.phone ? (
                    <a
                      className="flex items-center gap-2.5 transition-colors hover:text-gold-ink"
                      href={`tel:${lecturer.phone}`}
                    >
                      <Phone className="size-4 shrink-0 text-foreground/40" />
                      {lecturer.phone}
                    </a>
                  ) : null}
                  {lecturer.officeLocation ? (
                    <p className="flex items-center gap-2.5">
                      <MapPin className="size-4 shrink-0 text-foreground/40" />
                      {lecturer.officeLocation}
                    </p>
                  ) : null}
                  {lecturer.officeHours ? (
                    <p className="flex items-center gap-2.5">
                      <Clock className="size-4 shrink-0 text-foreground/40" />
                      {lecturer.officeHours}
                    </p>
                  ) : null}
                </div>

                {lecturer.courses.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {lecturer.courses.map((course) => (
                      <span
                        key={course.id}
                        className="rounded border border-hairline px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/60"
                      >
                        {course.code}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            icon={Users}
            title="No lecturers yet"
            description="Lecturer profiles will appear here."
          />
        </div>
      )}
    </div>
  );
}
