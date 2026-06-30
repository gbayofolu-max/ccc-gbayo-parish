export interface Announcement {
  id: number;
  title: string;
  date: string;               // ISO e.g. "2024-09-15"
  time?: string;              // optional – “10:00 AM”
  description: string;
  href?: string;              // external link (e.g., livestream)
  pdfUrl?: string;            // optional PDF under /public/announcements/
}

/**
 * All announcements – newest first.
 */
export const announcements: Announcement[] = [
  // --------------------------------------------------------------
  // 📄  NEW PDF‑TYPE ANNOUNCEMENTS
  // --------------------------------------------------------------
  {
    id: 100,
    title: "CCC Constitution",
    date: "2024-01-01",
    description:
      "The official constitution of the Celestial Church of Christ – Gbayo Parish.",
    pdfUrl: "/announcements/constitution.pdf",
  },
  {
    id: 101,
    title: "Hymn Book",
    date: "2024-02-01",
    description:
      "A collection of hymns used in worship at Gbayo Parish.",
    pdfUrl: "/announcements/hymn.pdf",
  },
  {
    id: 102,
    title: "Bible Lesson – (Month/Year)",
    date: "2024-03-01",
    description:
      "Weekly Bible‑lesson hand‑out. Download the PDF to follow along.",
    pdfUrl: "/announcements/bible-lesson.pdf",
  },

  // --------------------------------------------------------------
  // 📅  EXISTING EVENT ANNOUNCEMENTS
  // --------------------------------------------------------------
  {
    id: 1,
    title: "Weekly Worship Service",
    date: "2026-09-22",
    time: "09:30 AM",
    description:
      "Join us for the regular Sunday worship service at the main sanctuary.",
    href: "/events#weekly-service",
  },
  {
    id: 2,
    title: "Youth Prayer Night",
    date: "2026-09-18",
    time: "07:00 PM",
    description:
      "An empowering night of prayer, worship and fellowship for youth members.",
  },
  {
    id: 3,
    title: "Live‑Stream of the Anniversary Service",
    date: "2026-09-15",
    time: "10:00 AM",
    description:
      "Celebrating the 30th anniversary of the Gbayo Parish. Live‑stream on Facebook.",
    href: "https://www.facebook.com/your‑parish‑page/live",
  },
];
