import { SignUpForm } from "@/modules/auth/components/sign-up-form";
import { normalizeAuthCallbackURL } from "@/modules/auth/callback-url";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

interface SignUpPageProps {
  searchParams: Promise<{
    callbackURL?: string | string[];
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const callbackURL = normalizeAuthCallbackURL(params.callbackURL);

  return (
    <SignUpForm
      callbackURL={callbackURL}
      turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
    />
  );
}
