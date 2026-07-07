/** Kirstin Austin Ankrah's Financial Officer manifesto, distilled for the editorial page. */

export const manifestoIntro = {
  eyebrow: "Manifesto · Financial Officer",
  candidate: "Kirstin Austin Ankrah",
  affiliation: "Candidate · MELSSA · Accra Technical University",
  lead: "Trust is the foundation of every strong association. When members know exactly how their money is raised, budgeted and spent, they give with confidence and belong with pride. My vision is a MELSSA whose finances are open, accountable, and working for every single member.",
  body: "I am not offering promises alone — I am offering systems. Clear records, published budgets, honest reporting, and new sources of funding that ease the burden on members while strengthening everything we can achieve together.",
};

export interface Pillar {
  title: string;
  summary: string;
  practice: string[];
}

export const pillars: Pillar[] = [
  {
    title: "Open Books",
    summary:
      "Every member has a right to know how the association's money is handled. Financial reporting should be clear, regular and available to all — never locked away.",
    practice: [
      "Semester financial reports published at the close of each semester",
      "A comprehensive annual report for every academic year",
      "Records every member can view and download, any time",
    ],
  },
  {
    title: "Responsible Budgeting",
    summary:
      "Sound planning comes before spending. Every major programme should run on an approved budget that members are free to see.",
    practice: [
      "Published budgets for the White Coat Ceremony, Congress & Health Screening",
      "Costed plans for outreach and community programmes",
      "Spending measured against budget — openly and honestly",
    ],
  },
  {
    title: "Fundraising & Partnerships",
    summary:
      "A well-resourced association leans less on the pockets of its members. I will grow our income through campaigns, sponsors and lasting partnerships.",
    practice: [
      "Active fundraising campaigns with clear, shared goals",
      "Sponsorship opportunities for partners who believe in our work",
      "A visible register of sponsors and the programmes they support",
    ],
  },
  {
    title: "A Lasting Finance Desk",
    summary:
      "Accountability should outlast any single tenure. I will build a permanent digital home for our finances — reports, budgets and records in one trusted place.",
    practice: [
      "One official archive for reports, budgets & fundraising",
      "Consistent, professional financial documentation",
      "A standard the next officer can inherit and build upon",
    ],
  },
];

export const commitments = [
  "Integrity in every transaction",
  "Transparency members can verify",
  "Accountability without exception",
  "Prudence with every cedi",
  "Service to the whole association",
];
