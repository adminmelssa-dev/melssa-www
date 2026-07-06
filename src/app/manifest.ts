import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MELSSA Student Portal",
    short_name: "MELSSA",
    description:
      "Academic resources, association updates, events, and anonymous student support for MELSSA.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf8f1",
    theme_color: "#0e2a54",
    categories: ["education", "productivity"],
    icons: [
      {
        src: new URL("/icon.svg", env.NEXT_PUBLIC_APP_URL).toString(),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: new URL("/icon.svg", env.NEXT_PUBLIC_APP_URL).toString(),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
