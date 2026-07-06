import type { Metadata } from "next";
import { ManifestoPage } from "@/components/campaign/manifesto-page";

export const metadata: Metadata = {
  title: "A Voice for All — Kirstin Austin Ankrah",
  description:
    "Manifesto of Kirstin Austin Ankrah, candidate for Public Relations Officer of MELSSA, Accra Technical University.",
};

export default function Manifesto() {
  return <ManifestoPage />;
}
