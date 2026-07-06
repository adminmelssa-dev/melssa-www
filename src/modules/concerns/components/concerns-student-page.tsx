import {
  EyeOff,
  MessageCircleReply,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConcernSubmissionForm } from "@/modules/concerns/components/concern-submission-form";
import { requirePermission } from "@/server/auth/guards";
import { env } from "@/lib/env";

const assurances: {
  icon: LucideIcon;
  title: string;
  detail: string;
}[] = [
  {
    icon: EyeOff,
    title: "Anonymous",
    detail: "The form does not attach your portal identity.",
  },
  {
    icon: ShieldCheck,
    title: "Private review",
    detail: "Only authorized MELSSA reviewers can see submissions.",
  },
  {
    icon: MessageCircleReply,
    title: "Action tracked",
    detail: "Reviewers can update status and resolution notes.",
  },
];

export async function ConcernsStudentPage() {
  await requirePermission({ resource: "concern", action: "create" });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <p className="text-sm text-muted-foreground">Student support</p>
        <h1 className="font-heading text-2xl font-black">Submit concern</h1>
      </section>

      <section className="grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-3">
        {assurances.map((item) => (
          <AssuranceBlock key={item.title} item={item} />
        ))}
      </section>

      <section className="rounded-lg border border-hairline bg-background p-5 sm:p-6">
        <ConcernSubmissionForm
          turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        />
      </section>
    </div>
  );
}

function AssuranceBlock({
  item,
}: {
  item: {
    icon: LucideIcon;
    title: string;
    detail: string;
  };
}) {
  const Icon = item.icon;

  return (
    <div className="bg-background p-5">
      <Icon className="size-5 text-primary" />
      <div className="mt-3 text-sm font-semibold">{item.title}</div>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {item.detail}
      </p>
    </div>
  );
}
