import Image from "next/image";
import { CalendarDays, Handshake } from "lucide-react";
import { env } from "@/lib/env";
import { EmptyState } from "@/components/ui/empty-state";
import { Kicker } from "@/components/ui/kicker";
import { PublicPageHeader } from "@/components/public/public-page-header";
import { Reveal } from "@/components/ui/reveal";
import { FundraisingInquiryForm } from "@/modules/fundraising/components/fundraising-inquiry-form";
import type { FundraisingCampaignRow } from "@/modules/fundraising/contracts";
import { getSerializedPublishedFundraisingCampaigns } from "@/modules/fundraising/queries";

export async function FundraisingPublicPage() {
  const campaigns = await getSerializedPublishedFundraisingCampaigns();

  return (
    <div className="mx-auto max-w-6xl px-7 py-16">
      <PublicPageHeader
        kicker="Fundraising & Sponsorship"
        title="Support the work"
        description="Back a campaign, sponsor a programme, or partner with the association — every contribution accounted for, and every cedi put to work for members."
      />

      <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <Reveal key={campaign.id}>
                <CampaignArticle campaign={campaign} />
              </Reveal>
            ))
          ) : (
            <EmptyState
              description="Fundraising campaigns and sponsorship opportunities will appear here once they are published. Partners are welcome to reach out any time."
              icon={Handshake}
              title="No active campaigns yet"
            />
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-hairline bg-paper-2">
            <div className="border-b border-hairline p-6">
              <Kicker>Partner with us</Kicker>
              <h2 className="mt-3 text-2xl leading-tight">Sponsorship inquiry</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                Share your details and MELSSA&rsquo;s finance team will follow up
                about partnership opportunities.
              </p>
            </div>
            <div className="p-6">
              <FundraisingInquiryForm
                campaigns={campaigns}
                turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CampaignArticle({ campaign }: { campaign: FundraisingCampaignRow }) {
  return (
    <article className="overflow-hidden border border-hairline bg-paper-2">
      {campaign.cover ? (
        <div className="relative aspect-[16/7] w-full overflow-hidden">
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            src={campaign.cover.publicUrl}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 via-navy-deep/10 to-transparent"
          />
          {campaign.endsAt ? (
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-navy-deep/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-cream backdrop-blur">
              <CalendarDays className="size-3.5" />
              Closes {formatDate(campaign.endsAt)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="p-7 sm:p-9">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
          <span>Campaign</span>
          {!campaign.cover && campaign.endsAt ? (
            <span className="text-foreground/40">
              Closes {formatDate(campaign.endsAt)}
            </span>
          ) : null}
        </div>
        <h2 className="mt-2.5 text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.1]">
          {campaign.title}
        </h2>
        {campaign.summary ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/70">
            {campaign.summary}
          </p>
        ) : null}

        {campaign.goalAmountMinor ? (
          <div className="mt-7 border-t border-hairline pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
              Fundraising goal
            </p>
            <p className="mt-1.5 text-[clamp(1.8rem,3vw,2.4rem)] tabular-nums text-gold-ink">
              {formatCurrency(campaign.goalAmountMinor, campaign.currency)}
            </p>
          </div>
        ) : null}

        {campaign.paymentInstructions || campaign.paymentMethods.length > 0 ? (
          <div className="mt-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
              How to give
            </p>
            {campaign.paymentInstructions ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
                {campaign.paymentInstructions}
              </p>
            ) : null}
            {campaign.paymentMethods.length > 0 ? (
              <div className="mt-3 border-t border-hairline">
                {campaign.paymentMethods.map((method, index) => (
                  <div
                    className="flex flex-col gap-1 border-b border-hairline py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                    key={`${method.label}-${index}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {method.label}
                      </p>
                      {method.instructions ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-foreground/55">
                          {method.instructions}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 sm:text-right">
                      {method.accountNumber ? (
                        <p className="font-mono text-sm text-foreground">
                          {method.accountNumber}
                        </p>
                      ) : null}
                      <p className="text-xs text-foreground/55">
                        {[method.network, method.accountName]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {campaign.sponsorshipTiers.length > 0 ? (
          <div className="mt-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
              Sponsorship tiers
            </p>
            <div className="mt-3 grid gap-px overflow-hidden border border-hairline bg-hairline sm:grid-cols-2">
              {campaign.sponsorshipTiers.map((tier, index) => (
                <div
                  className="flex flex-col bg-paper-2 p-5"
                  key={`${tier.name}-${index}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-lg leading-tight">{tier.name}</p>
                    {tier.amountLabel ? (
                      <p className="shrink-0 text-sm font-medium text-gold-ink">
                        {tier.amountLabel}
                      </p>
                    ) : null}
                  </div>
                  {tier.benefits.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {tier.benefits.map((benefit, benefitIndex) => (
                        <li
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/70"
                          key={`${benefit}-${benefitIndex}`}
                        >
                          <span
                            aria-hidden
                            className="mt-[0.4rem] size-1 shrink-0 rounded-full bg-gold"
                          />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatCurrency(amountMinor: number, currency: string): string {
  const amount = amountMinor / 100;

  try {
    return new Intl.NumberFormat("en-GH", {
      currency,
      style: "currency",
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${new Intl.NumberFormat("en-GH", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount)}`;
  }
}
