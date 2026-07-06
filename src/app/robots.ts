import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: new URL("/sitemap.xml", env.NEXT_PUBLIC_APP_URL).toString(),
    host: env.NEXT_PUBLIC_APP_URL,
  };
}
