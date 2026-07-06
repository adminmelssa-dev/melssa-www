/** Kirstin Austin Ankrah's PRO manifesto, distilled for the editorial page. */

export const manifestoIntro = {
  eyebrow: "Manifesto · Public Relations Officer",
  candidate: "Kirstin Austin Ankrah",
  affiliation: "Candidate · MELSSA · Accra Technical University",
  lead: "Communication is the heartbeat of every successful association. It informs, connects, and inspires participation. My vision is to ensure that every member of MELSSA feels informed, represented, and proud to belong.",
  body: "I am not just offering ideas — I am offering a commitment to build stronger systems that improve communication, increase visibility, and create opportunities for every member to contribute.",
};

export interface Pillar {
  title: string;
  summary: string;
  practice: string[];
}

export const pillars: Pillar[] = [
  {
    title: "Effective Communication",
    summary:
      "Information should reach everyone at the right time. No member should miss an announcement, opportunity or activity because of poor communication.",
    practice: [
      "A Weekly MELSSA Bulletin of announcements, opportunities & deadlines",
      "A communication calendar for early, consistent publicity",
      "Stronger links between the executive, class reps and members",
    ],
  },
  {
    title: "The MELSSA Media Hub",
    summary:
      "Great publicity is achieved through teamwork. I will activate the Editorial & Publicity Committee into a full Media Hub.",
    practice: [
      "Photography, videography, design, writing & social media",
      "Professional documentation of every event",
      "Real opportunities for members to build media skills",
    ],
  },
  {
    title: "Digital Transformation",
    summary:
      "A modern association deserves a modern digital presence — and a central home for everything MELSSA online.",
    practice: [
      "An official website for announcements, archives & resources",
      "A better-organised, accessible digital archive",
      "A consistent, professional identity across all platforms",
    ],
  },
  {
    title: "Member Engagement & Representation",
    summary:
      "Every voice deserves to be heard. Communication should flow from members to leadership, not only the other way.",
    practice: [
      "Accessible channels for feedback, suggestions & concerns",
      "MELSSA Spotlight, celebrating members' achievements",
      "Interactive content, polls & real participation",
    ],
  },
  {
    title: "Building the MELSSA Brand",
    summary:
      "Our image should reflect our excellence. I will strengthen MELSSA's identity through professional, consistent communication.",
    practice: [
      "Quality publicity before, during & after every programme",
      "Standardised design for official publications",
      "Showcasing MELSSA within and beyond ATU",
    ],
  },
];

export const commitments = [
  "Integrity in leadership",
  "Professionalism in communication",
  "Creativity in publicity",
  "Transparency in representation",
  "Dedication to every member",
];
