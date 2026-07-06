import type { Metadata } from "next";
import { BulletinUnsubscribePage } from "@/modules/bulletin/components/bulletin-unsubscribe-page";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: {
    index: false,
    follow: false,
  },
};

interface BulletinUnsubscribeRouteProps {
  searchParams: Promise<{
    token?: string | string[];
  }>;
}

export default async function BulletinUnsubscribeRoute({
  searchParams,
}: BulletinUnsubscribeRouteProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token)
    ? params.token[0] ?? null
    : params.token ?? null;

  return <BulletinUnsubscribePage token={token} />;
}
