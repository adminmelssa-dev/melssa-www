import { EyeOff, MessageCircleReply, ShieldCheck } from "lucide-react";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { ConcernSubmissionForm } from "@/modules/concerns/components/concern-submission-form";
import { env } from "@/lib/env";

const assurances = [
  {
    icon: EyeOff,
    title: "Anonymous",
    detail: "The form never asks for your identity.",
  },
  {
    icon: ShieldCheck,
    title: "No login",
    detail: "Submit without an account.",
  },
  {
    icon: MessageCircleReply,
    title: "Tracked",
    detail: "Executives respond and resolve.",
  },
];

export function ConcernsPublicPage() {
  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Student support"
        title={
          <>
            Every voice, <em className="italic text-gold-ink">heard.</em>
          </>
        }
        description="Share academic, welfare, finance, facilities or safety concerns with MELSSA leadership. This form never asks for your identity."
      />

      <div className="mt-8 grid max-w-3xl gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-3">
        {assurances.map((item) => (
          <div key={item.title} className="bg-background p-5">
            <item.icon className="size-5 text-gold-ink" />
            <div className="mt-3 text-sm font-semibold text-foreground">
              {item.title}
            </div>
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-foreground/55">
              {item.detail}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 max-w-2xl">
        <ConcernSubmissionForm
          turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        />
      </div>
    </div>
  );
}
