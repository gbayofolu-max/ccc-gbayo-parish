import Image from "next/image";
import { announcements } from "@/data/announcements";
import { PdfViewer } from "@/components/PdfViewer";

export const metadata = {
  title: "Announcements & Sermon Slides | CCC Gbayo Parish",
  description: "Download the latest church announcements, hymn PDFs, Bible-lesson PDFs and sermon slide decks.",
};

export default function AnnouncementsPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-12 bg-slate-50 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-serif text-navy mb-8 text-center font-bold">
        Announcements &amp; Sermon Slides
      </h1>
      <div className="mx-auto mb-12 h-1 w-20 bg-gold rounded-full" />

      <div className="grid gap-6 sm:grid-cols-2">
        {announcements.map((a) => (
          <article
            key={a.id}
            className="border border-gold/20 rounded-2xl hover:shadow-xl transition-all bg-white p-6 shadow-sm"
          >
            <header className="flex flex-col gap-1 mb-4">
              <h2 className="text-xl font-bold text-navy">{a.title}</h2>
              <time
                className="text-sm text-gray-500"
                dateTime={a.date}
              >
                {new Date(a.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </header>

            {a.thumbnail && (
              <figure className="mb-4 overflow-hidden rounded-xl">
                <Image
                  src={a.thumbnail}
                  alt={`${a.title} thumbnail`}
                  width={400}
                  height={250}
                  className="w-full h-auto object-cover"
                />
              </figure>
            )}

            {a.pdfUrl && <PdfViewer pdfUrl={a.pdfUrl} title={a.title} />}

            {a.href && (
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block px-6 py-2 bg-navy text-gold rounded-full text-sm font-bold hover:bg-navy-mid transition"
              >
                More Information
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}