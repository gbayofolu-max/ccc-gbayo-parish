export interface SermonSlide {
  id: string;
  title: string;
  image: string; // path inside /public/sermons/
  pdf?: string;  // optional downloadable slide‑deck PDF
}

export const sermonSlides: SermonSlide[] = [
  {
    id: "01",
    title: "Faith & Works",
    image: "/sermons/faith-works.jpg",
    pdf: "/sermons/faith-works.pdf",
  },
  {
    id: "02",
    title: "The Power of Prayer",
    image: "/sermons/prayer-power.jpg",
    pdf: "/sermons/prayer-power.pdf",
  },
  // ➜ Add more objects here as you upload more slides
];
