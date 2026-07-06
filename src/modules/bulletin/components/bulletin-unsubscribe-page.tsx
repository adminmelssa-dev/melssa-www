import Link from "next/link";
import { MailCheck, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulletinUnsubscribeForm } from "@/modules/bulletin/components/bulletin-unsubscribe-form";
import { bulletinUnsubscribeInputSchema } from "@/modules/bulletin/contracts";
import { getBulletinUnsubscribePreview } from "@/modules/bulletin/server/subscriptions";

interface BulletinUnsubscribePageProps {
  token: string | null;
}

export async function BulletinUnsubscribePage({
  token,
}: BulletinUnsubscribePageProps) {
  const parsedToken = bulletinUnsubscribeInputSchema.safeParse({ token });

  if (!parsedToken.success) {
    return <UnavailableState />;
  }

  const preview = await getBulletinUnsubscribePreview(parsedToken.data.token);

  if (!preview) {
    return <UnavailableState />;
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-7 py-24">
      <div className="space-y-6 border-l-2 border-gold pl-6">
        <span className="flex size-11 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          {preview.status === "active" ? (
            <MailX className="size-5" />
          ) : (
            <MailCheck className="size-5" />
          )}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Weekly Bulletin</p>
          <h1 className="font-heading text-3xl text-foreground">
            {preview.status === "active"
              ? "Unsubscribe from the bulletin"
              : "Already unsubscribed"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            {preview.status === "active"
              ? `${preview.email} will stop receiving weekly bulletin emails.`
              : `${preview.email} is no longer receiving weekly bulletin emails.`}
          </p>
        </div>

        {preview.status === "active" ? (
          <BulletinUnsubscribeForm token={parsedToken.data.token} />
        ) : (
          <Button asChild variant="outline">
            <Link href="/">Return home</Link>
          </Button>
        )}
      </div>
    </main>
  );
}

function UnavailableState() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-7 py-24">
      <div className="space-y-6 border-l-2 border-gold pl-6">
        <span className="flex size-11 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <MailX className="size-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Weekly Bulletin</p>
          <h1 className="font-heading text-3xl text-foreground">
            Link unavailable
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            This unsubscribe link is invalid or no longer available.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
