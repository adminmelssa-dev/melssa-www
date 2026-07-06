import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { IntroStatement } from "@/components/home/intro-statement";
import { ExploreIndex } from "@/components/home/explore-index";
import { LatestAnnouncements } from "@/components/home/latest-announcements";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { RecentUploads } from "@/components/home/recent-uploads";
import { StudentSpotlight } from "@/components/home/student-spotlight";
import { ConcernCta } from "@/components/home/concern-cta";

export const metadata: Metadata = {
  title: "MELSSA Student Portal",
  description:
    "Academic resources, association updates, events, and anonymous student support for MELSSA students.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroStatement />
      <ExploreIndex />
      <LatestAnnouncements />
      <UpcomingEvents />
      <RecentUploads />
      <StudentSpotlight />
      <ConcernCta />
    </>
  );
}
