import Image from 'next/image';

export default function MotherCelestial() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F0] via-[#F5F0E8] to-[#FDF8F0] py-12 md:py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="h-px w-12 bg-[#d4af37]" />
            <span className="text-[#8B7E66] text-xs font-bold tracking-[0.25em] uppercase">CCC Gbayo Parish</span>
            <span className="h-px w-12 bg-[#d4af37]" />
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#0A1628] mb-2">
            Mother Celestial <span className="text-[#d4af37]">S.O. Gbayo</span>
          </h1>
          <p className="text-[#5A4A2F] italic text-lg font-serif">The Deborah of Our Time</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#e8e0d0] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* LEFT: Image */}
            <div className="relative bg-[#F5F0E8] flex items-center justify-center p-4 md:p-6 min-h-[400px] lg:min-h-[600px]">
              <div className="relative w-full h-full max-h-[600px]">
                <Image
                  src="/mother/mother-celestial.jpg"
                  alt="Mother Celestial S.O. Gbayo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              {/* Corner accents */}
              <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-[#d4af37]/50 rounded-tl-lg pointer-events-none" />
              <div className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-[#d4af37]/50 rounded-br-lg pointer-events-none" />
            </div>

            {/* RIGHT: Text */}
            <div className="p-6 md:p-10 lg:p-12 flex flex-col justify-center">
              
              <blockquote className="mb-6 pl-5 border-l-2 border-[#d4af37]/40">
                <p className="font-serif text-xl md:text-2xl italic text-[#0A1628] leading-relaxed">
                  &ldquo;A beacon of holiness and a pillar of strength in the fold of Christ.&rdquo;
                </p>
              </blockquote>

              <div className="space-y-5 text-[#3d3425] leading-[1.8] text-[15px]">
                <p>
                  Mother Celestial S.O. Gbayo is a great prophetess of God and a divine instrument of grace. 
                  It was through her spiritual calling and unwavering faith that our father,{' '}
                  <span className="font-semibold text-[#0A1628]">Rev. H.M. Gbayo</span>, joined the celestial fold, 
                  opening a gateway of salvation for many.
                </p>

                <p>
                  She is truly the <span className="font-semibold text-[#0A1628]">Deborah of our time</span>—a leader 
                  not moved by material things, but driven by the Spirit of the Living God. She stands as a firm guard 
                  of the faith, ensuring that this institution continues in the holy legacy left by{' '}
                  <span className="font-semibold text-[#0A1628]">Papa S.B.J. Oshoffa</span> and{' '}
                  <span className="font-semibold text-[#0A1628]">Rev. H.M. Gbayo</span>.
                </p>

                {/* Scripture Card */}
                <div className="my-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0f2240] via-[#162b4d] to-[#1a3260] border border-[#d4af37]/30 shadow-md">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4af37] via-[#f0d878] to-[#d4af37]" />
                  <div className="p-5 pl-7">
                    <p className="font-serif text-[#f8f4e8] text-[15px] leading-[1.85] italic">
                      Like Anna in Luke 2:36, she is found always in the temple, serving God with fasting and prayers 
                      night and day, guiding the levites and the congregation with a mother&apos;s heart and a prophet&apos;s vision.
                    </p>
                  </div>
                </div>

                <p>
                  Her dedication to prayer is a shelter for all who seek refuge. She is a tremendous blessing in 
                  our midst, a vessel of purity and a fountain of wisdom whose life is a living testament to the 
                  power of holiness and dedication.
                </p>

                {/* Requested text */}
                <div className="mt-4 p-5 rounded-xl bg-[#F5F0E8] border border-[#d4af37]/20">
                  <p className="font-serif italic text-[#5A4A2F] text-base leading-relaxed">
                    She is a woman so contented in what the Lord has given her, mother for all, always looking to 
                    achieve the ultimate goal which is a salubrious post by the side of God the Almighty. A woman 
                    with characters worthy of emulating.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#e8e0d0] flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/40 to-transparent" />
                <span className="text-[#8B7E66] text-xs font-bold tracking-[0.2em] uppercase">CCC Gbayo Parish</span>
                <span className="h-px flex-1 bg-gradient-to-l from-[#d4af37]/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}