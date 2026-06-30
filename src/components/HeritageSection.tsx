// src/components/HeritageSection.tsx
import Image from "next/image";

const cards = [
  {
    title: "Lord Jesus Christ",
    subtitle: "Our Saviour & King",
    img: "/jesus.jpg",
    border: "border-blue-600", // deep‑blue border for the Trinity
  },
  {
    title: "Papa Samuel B.J. Oshoffa",
    subtitle: "Founder, CCC Worldwide",
    img: "/oshoffa.jpg",
    border: "border-gold",
  },
  {
    title: "Rev. Henry Moronfolu Gbayo",
    subtitle: "Founder, CCC Gbayo Parish",
    img: "/rev-gbayo.jpg",
    border: "border-gold",
  },
];

export default function HeritageSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        {/* ---------- Title ---------- */}
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-bold text-blue-950 md:text-4xl">
            Our Heritage
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gold" />
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            We proudly stand upon the spiritual foundation laid through the
            Trinity and our founding fathers.
          </p>
        </div>

        {/* ---------- 3 circles (same size) ---------- */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {cards.map(({ title, subtitle, img, border }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div className={`h-48 w-48 overflow-hidden rounded-full shadow-xl ${border}`}>
                <Image
                  src={img}
                  alt={title}
                  width={192}
                  height={192}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-5 text-lg font-bold text-blue-950">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}