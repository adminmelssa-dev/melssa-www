import { SignUpForm } from "@/modules/auth/components/sign-up-form";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <SignUpForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null} />
  );
}
