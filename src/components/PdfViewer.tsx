// src/components/PdfViewer.tsx
"use client";

import { useState } from "react";

interface PdfViewerProps {
  pdfUrl: string;
  title?: string;
}

export const PdfViewer = ({ pdfUrl, title }: PdfViewerProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="my-4">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}

      {/* CTA button – mobile‑friendly */}
      <button
        onClick={() => setShow(!show)}
        className="px-4 py-2 bg-gold text-[#0a1628] rounded hover:bg-dark-gold transition"
      >
        {show ? "Hide PDF" : "View PDF"}
      </button>

      {/* The embed – 100% width, responsive height */}
      {show && (
        <div className="mt-4 rounded overflow-hidden border border-gold/30">
          <embed
            src={pdfUrl}
            type="application/pdf"
            className="w-full h-[70vh] md:h-[80vh]"
          />
        </div>
      )}
    </div>
  );
};