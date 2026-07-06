import type { Metadata } from "next";
import { MelssaWordmark } from "@/components/brand/melssa-wordmark";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy-deep p-12 text-cream lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-8 border border-cream/12"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(246,241,231,0.14)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_20%,transparent_72%)]"
        />
        <MelssaWordmark onDark className="relative" />

        <div className="relative max-w-md">
          <p className="font-heading text-[clamp(1.8rem,2.4vw,2.6rem)] leading-[1.2] text-cream">
            Every resource, every update, every voice —{" "}
            <em className="italic text-gold-bright">in one place.</em>
          </p>
          <p className="mt-6 text-sm leading-relaxed text-cream/55">
            Medical Laboratory Sciences Students&rsquo; Association · Accra
            Technical University
          </p>
        </div>

        <p className="relative font-heading text-[15px] italic text-gold-bright">
          Integrity, Creativity &amp; Excellence
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <MelssaWordmark className="mb-10 lg:hidden" />
          {children}
        </div>
      </div>
    </main>
  );
}
