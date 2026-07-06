import { SignInForm } from "@/modules/auth/components/sign-in-form";
import { normalizeAuthCallbackURL } from "@/modules/auth/callback-url";

interface SignInPageProps {
  searchParams: Promise<{
    callbackURL?: string | string[];
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackURL = normalizeAuthCallbackURL(params.callbackURL);

  return <SignInForm callbackURL={callbackURL} />;
}
