import Image from 'next/image';

export default function MotherCelestial() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gold/30">
        <div className="relative h-96 w-full">
          <Image 
            src="/mother/portrait.jpg" 
            alt="Mother Celestial S.O GBAYO" 
            fill 
            className="object-cover"
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="font-serif text-4xl font-bold">Mother Celestial S.O GBAYO</h1>
            <p className="text-gold italic text-lg">The Deborah of Our Time</p>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-6 text-navy leading-relaxed">
          <p className="font-serif text-xl italic text-center text-navy-mid mb-8">
            "A beacon of holiness and a pillar of strength in the fold of Christ."
          </p>
          
          <div className="space-y-4 text-lg">
            <p>
              Mother Celestial S.O GBAYO is a great prophetess of God and a divine instrument of grace. 
              It was through her spiritual calling and unwavering faith that our father, 
              <span className="font-bold text-navy-mid"> Rev. H.M Gbayo</span>, joined the celestial fold, 
              opening a gateway of salvation for many.
            </p>
            <p>
              She is truly the <span className="font-bold">Deborah of our time</span>—a leader not moved by 
              material things, but driven by the Spirit of the Living God. She stands as a firm guard of 
              the faith, ensuring that this institution continues in the holy legacy left by 
              <span className="font-bold">Papa S.B.J Oshoffa</span> and <span className="font-bold">Rev. H.M Gbayo</span>.
            </p>
            <p className="italic bg-gold/10 p-4 rounded-lg border-l-4 border-gold">
              Like Anna in Luke 2:36, she is found always in the temple, serving God with fasting and prayers 
              night and day, guiding the levites and the congregation with a mother's heart and a prophet's vision.
            </p>
            <p>
              Her dedication to prayer is a shelter for all who seek refuge. She is a tremendous blessing in 
              our midst, a vessel of purity and a fountain of wisdom whose life is a living testament to the 
              power of holiness and dedication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}