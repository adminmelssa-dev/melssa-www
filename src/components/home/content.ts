/**
 * Placeholder content for the marketing homepage. Presentational only — once the
 * announcement/event/resource modules exist this is replaced by their queries.
 */

export interface HeroImage {
  src: string;
  alt: string;
}

export interface ExploreItem {
  title: string;
  description: string;
  href: string;
}

export interface AnnouncementSummary {
  category: string;
  title: string;
  date: string;
  href: string;
  excerpt?: string;
  author?: string;
  authorInitials?: string;
}

export interface EventSummary {
  day: string;
  month: string;
  title: string;
  location: string;
  time: string;
  /** ISO date used by the live countdown; omit for "save the date" style rows. */
  target?: string;
  note?: string;
  href: string;
}

export interface UploadSummary {
  type: "PDF" | "PPT" | "DOC";
  title: string;
  source: string;
  tag: string;
  /** Combined size + date, e.g. "3.2 MB · 6 Jul". */
  size: string;
  href: string;
}

export const heroImages: HeroImage[] = [
  { src: "/atu-students.jpg", alt: "MELSSA members studying together on campus" },
  { src: "/atu-grad-students.jpg", alt: "Graduands celebrating at the ATU congregation" },
  { src: "/atu-building.jpg", alt: "Accra Technical University campus" },
  { src: "/atu-entrance.jpg", alt: "The Accra Technical University entrance" },
];

export const heroStats = [
  { value: "240+", label: "Lecture slides, by course" },
  { value: "85", label: "Past questions to revise with" },
  { value: "12", label: "Events this semester" },
  { value: "320", label: "Members and growing" },
] as const;

export const exploreItems: ExploreItem[] = [
  {
    title: "Announcements",
    description: "Association updates and the Weekly MELSSA Bulletin.",
    href: "/announcements",
  },
  {
    title: "Resources",
    description:
      "Lecture slides and past questions, organised by level, semester and course.",
    href: "/resources",
  },
  {
    title: "Events",
    description: "Congress, health outreach, seminars and screenings.",
    href: "/events",
  },
  {
    title: "Lecturers",
    description: "Contacts, courses taught and office hours.",
    href: "/lecturers",
  },
  {
    title: "Concerns",
    description: "A private, anonymous channel — every voice heard.",
    href: "/concerns",
  },
];

export const leadAnnouncement: AnnouncementSummary = {
  category: "Academics",
  title: "Semester 2 examination timetable is now released.",
  excerpt:
    "The provisional timetable for Levels 100 through 400 is available in the resources archive. Review your schedule and report any clashes to your class representative before Friday.",
  author: "Exams Committee",
  authorInitials: "EC",
  date: "6 July 2026",
  href: "/announcements",
};

export const announcementList: AnnouncementSummary[] = [
  {
    category: "Notice",
    title: "Lab coat & ID card distribution for Level 100",
    date: "4 Jul",
    href: "/announcements",
  },
  {
    category: "Opportunity",
    title: "Join the MELSSA Media Hub — photographers & writers wanted",
    date: "2 Jul",
    href: "/announcements",
  },
  {
    category: "Academics",
    title: "Guest lecture: Molecular Diagnostics in modern practice",
    date: "28 Jun",
    href: "/announcements",
  },
  {
    category: "Welfare",
    title: "Updated office hours for the welfare desk",
    date: "24 Jun",
    href: "/announcements",
  },
];

export const upcomingEvents: EventSummary[] = [
  {
    day: "18",
    month: "Jul",
    title: "Community Health Screening",
    location: "ATU Main Campus",
    time: "9:00 AM – 2:00 PM",
    target: "2026-07-18T09:00:00",
    href: "/events",
  },
  {
    day: "02",
    month: "Aug",
    title: "MELSSA Congress 2026",
    location: "Assembly Hall",
    time: "4:00 PM",
    note: "Registration open",
    href: "/events",
  },
  {
    day: "14",
    month: "Aug",
    title: "Blood Donation Drive",
    location: "Science Block",
    time: "10:00 AM",
    target: "2026-08-14T10:00:00",
    href: "/events",
  },
];

export const recentUploads: UploadSummary[] = [
  {
    type: "PDF",
    title: "Clinical Chemistry — Enzymes & Isoenzymes",
    source: "Dr. Kwabena Osei",
    tag: "Level 300",
    size: "3.2 MB · 6 Jul",
    href: "/resources",
  },
  {
    type: "PPT",
    title: "Haematology — Anaemia Classification",
    source: "Mrs. Adjoa Mensah",
    tag: "Level 200",
    size: "8.7 MB · 5 Jul",
    href: "/resources",
  },
  {
    type: "DOC",
    title: "Medical Microbiology — Practical Manual",
    source: "Dr. Yaw Boateng",
    tag: "Level 400",
    size: "1.1 MB · 4 Jul",
    href: "/resources",
  },
  {
    type: "PDF",
    title: "Immunology — Past Questions, 2019–2024",
    source: "Compiled archive",
    tag: "Past questions",
    size: "5.4 MB · 3 Jul",
    href: "/resources",
  },
];

export const spotlight = {
  quote:
    "The association gave me a platform to lead. Representing MELSSA at the regional congress changed how I see my own future in the profession.",
  name: "Ama Serwaa",
  role: "Level 400 · Leadership Award, 2026",
  image: "/atu-grad-students.jpg",
  imageAlt: "MELSSA graduand at the ATU congregation",
} as const;
