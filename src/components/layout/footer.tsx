import Link from "next/link";
import { Globe, Mail, MessageCircle } from "lucide-react";
import { MelssaWordmark } from "@/components/brand/melssa-wordmark";
import { BulletinSignupForm } from "@/components/layout/bulletin-signup-form";

interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

const footerColumns: FooterColumn[] = [
  {
    heading: "Resources",
    links: [
      { label: "Lecture slides", href: "/resources?type=lecture_slide" },
      { label: "Past questions", href: "/resources?type=past_question" },
      { label: "Lecturer directory", href: "/lecturers" },
      { label: "Search the archive", href: "/resources" },
    ],
  },
  {
    heading: "Association",
    links: [
      { label: "Announcements", href: "/announcements" },
      { label: "Events", href: "/events" },
      { label: "Student spotlight", href: "/spotlight" },
      { label: "Gallery", href: "/gallery" },
      { label: "Manifesto", href: "/manifesto" },
    ],
  },
];

const socials = [
  { label: "Email", href: "mailto:melssa@atu.edu.gh", icon: Mail },
  { label: "Contact", href: "/concerns", icon: MessageCircle },
  { label: "Website", href: "/", icon: Globe },
];

export function Footer() {
  return (
    <footer className="bg-navy-deep text-cream/70">
      <div className="mx-auto grid max-w-6xl gap-12 px-7 py-20 md:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1.2fr]">
        <div>
          <MelssaWordmark onDark />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-cream/60">
            The central academic resource and communications hub for the Medical
            Laboratory Sciences Students&rsquo; Association.
          </p>
          <div className="mt-6 flex gap-5">
            {socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-cream/60 transition-colors hover:text-gold-bright"
              >
                <social.icon className="size-5" />
              </Link>
            ))}
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.heading}>
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-bright">
              {column.heading}
            </h4>
            <ul className="mt-5 space-y-1">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-block py-1.5 text-sm text-cream/65 transition-all hover:pl-1 hover:text-gold-bright"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-bright">
            The Weekly Bulletin
          </h4>
          <p className="mt-5 text-sm leading-relaxed text-cream/60">
            Association news in your inbox, every week.
          </p>
          <BulletinSignupForm />
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-7 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-cream/50">
            © 2026 MELSSA · Accra Technical University
          </p>
          <p className="font-heading text-[15px] italic text-gold-bright">
            Integrity, Creativity &amp; Excellence
          </p>
        </div>
      </div>
    </footer>
  );
}
