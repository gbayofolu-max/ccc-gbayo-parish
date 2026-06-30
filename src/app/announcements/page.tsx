import Image from "next/image";
import { announcements } from "@/data/announcements";
import { PdfViewer } from "@/components/PdfViewer";

export const metadata = {
  title: "Announcements & Sermon Slides | CCC Gbayo Parish",
  description:
    "Download the latest church announcements, hymn PDFs, Bible‑lesson PDFs and sermon slide decks.",
};

export default function AnnouncementsPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-garamond text-gold mb-8 text-center">
        Announcements &amp; Sermon Slides
      </h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {announcements.map((a) => (
          <article
            key={a.id}
            className="border border-gold/20 rounded-xl hover:shadow-lg hover:shadow-gold/10 transition bg-[#0a1628] p-5"
          >
            <header className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-gold">{a.title}</h2>
              <time
                dateTime={a.date}
                className="text-sm text-gray-400"
                aria-label={`Published ${new Date(a.date).toLocaleDateString()}`}
              >
                {new Date(a.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </header>

            {a.thumbnail && (
              <figure className="my-4">
                <Image
                  src={a.thumbnail}
                  alt={`${a.title} thumbnail`}
                  width={400}
                  height={250}
                  className="rounded-lg object-cover"
                  placeholder="blur"
                  blurDataURL="/placeholder.png"
                />
              </figure>
            )}

            {a.pdfUrl && <PdfViewer pdfUrl={a.pdfUrl} title={a.title} />}

            {a.href && (
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block px-4 py-2 bg-gold text-[#0a1628] rounded hover:bg-dark-gold transition"
              >
                More info
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
