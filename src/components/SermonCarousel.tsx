"use client";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { sermonSlides } from "@/data/sermons";
import { PdfViewer } from "@/components/PdfViewer";

export const SermonCarousel = () => {
  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 8000, disableOnInteraction: false }}
      loop
      className="my-8"
    >
      {sermonSlides.map((slide) => (
        <SwiperSlide key={slide.id}>
          <article className="relative rounded-lg overflow-hidden border border-gold/30">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-64 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-4">
              <h3 className="text-2xl font-garamond text-gold">{slide.title}</h3>
              {slide.pdf && <PdfViewer pdfUrl={slide.pdf} title={slide.title} />}
            </div>
          </article>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};
