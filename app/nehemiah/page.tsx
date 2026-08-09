import NehemiahFullChat from '@/components/nehemiah/NehemiahFullChat';

export default function NehemiahPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-navy via-navy-mid to-navy px-4 md:px-6 py-12 md:py-16">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-gold text-xs font-bold tracking-[0.25em] uppercase mb-4">
            Project Nehemiah
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">
            Rebuild. Restore. Strengthen.
          </h1>
          <p className="text-white/70 max-w-xl mx-auto">
            A quiet space to bring your questions, your studies, and your heart —
            grounded in Scripture, guided in love.
          </p>
        </div>

        <NehemiahFullChat />

      </div>
    </main>
  );
}