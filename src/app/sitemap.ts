import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

type SitemapRoute = {
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
};

const sitemapRoutes: SitemapRoute[] = [
  {
    path: "",
    changeFrequency: "daily",
    priority: 1,
  },
  {
    path: "/announcements",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/events",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/resources",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/finance",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/fundraising",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  // Scholarship page is built but hidden until MELSSA asks for it.
  // {
  //   path: "/scholarships",
  //   changeFrequency: "weekly",
  //   priority: 0.7,
  // },
  {
    path: "/lecturers",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/gallery",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/spotlight",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/spotlights",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/concerns",
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return sitemapRoutes.map((route) => ({
    ...route,
    url: new URL(route.path, env.NEXT_PUBLIC_APP_URL).toString(),
    lastModified,
  }));
}
