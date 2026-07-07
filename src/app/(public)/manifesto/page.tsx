import type { Metadata } from "next";
import { ManifestoPage } from "@/components/campaign/manifesto-page";

export const metadata: Metadata = {
  title: "Manifesto — Kirstin Austin Ankrah",
  description:
    "Kirstin Austin Ankrah, candidate for Financial Officer of MELSSA, Accra Technical University — open books, responsible budgeting, and a lasting finance desk for every member.",
};

export default function Manifesto() {
  return <ManifestoPage />;
}
