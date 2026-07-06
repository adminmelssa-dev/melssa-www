import type { Metadata } from "next";
import { EventsPublicPage } from "@/modules/events/components/events-public-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming MELSSA programs, academic activities, congresses, outreach events, and student gatherings.",
  alternates: {
    canonical: "/events",
  },
};

export default function PublicEventsPage() {
  return <EventsPublicPage />;
}
