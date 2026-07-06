import type { Metadata } from "next";
import { AcceptInvitePage } from "@/modules/auth/components/accept-invite-page";

export const metadata: Metadata = {
  title: "Accept Invitation",
};

interface AcceptInviteRouteProps {
  searchParams: Promise<{
    token?: string | string[];
  }>;
}

export default async function AcceptInviteRoute({
  searchParams,
}: AcceptInviteRouteProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token)
    ? params.token[0] ?? null
    : params.token ?? null;

  return <AcceptInvitePage token={token} />;
}
