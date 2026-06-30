'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

type HistoryCardProps = {
  title: string;
  date: string;
  description: ReactNode;
  imageSrc: string;
};

export default function HistoryCard({
  title,
  date,
  description,
  imageSrc,
}: HistoryCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-48 w-full">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          priority={false}
        />
      </div>

      {/* Text content */}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {date && <p className="mt-1 text-sm text-gray-500">{date}</p>}
        <div className="mt-3 text-gray-700">{description}</div>
      </div>
    </article>
  );
}