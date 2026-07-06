import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-md bg-primary/10 text-primary">
        <MailCheck className="size-7" />
      </div>
      <div>
        <h1 className="font-heading text-2xl font-black">Check your email</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          If verification is required, use the link we sent to activate your
          MELSSA portal account.
        </p>
      </div>
      <Button variant="outline" className="w-full" asChild>
        <Link href="/sign-in">
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </Button>
    </div>
  );
}
