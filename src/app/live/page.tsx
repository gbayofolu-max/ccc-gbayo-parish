export const metadata = {
  title: "Live Worship | CCC Gbayo Parish",
  description:
    "Watch our worship services live from anywhere in the world.",
};

export default function LivePage() {
  // 👉 Replace with your actual YouTube Live video ID
  const YT_LIVE_ID = "YOUR_YOUTUBE_LIVE_ID";

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-garamond text-gold mb-6">
        Live Worship
      </h1>

      <p className="text-gray-300 mb-4 font-inter">
        Join us live from CCC Gbayo Parish, Ikorodu. If the stream hasn’t started
        yet, the player will show the most recent broadcast.
      </p>

      {/* 16:9 responsive container */}
      <div className="relative w-full pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg shadow-gold/10 border border-gold/20">
        <iframe
          src={`https://www.youtube.com/embed/${YT_LIVE_ID}?autoplay=1&mute=1`}
          title="Live worship stream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>

      <p className="mt-4 text-sm text-gray-400">
        If the video does not appear, click the play button above. You can also
        watch later on our{" "}
        <a
          href="https://www.youtube.com/channel/CHANNEL_ID"
          className="text-gold underline hover:text-dark-gold"
          target="_blank"
          rel="noopener noreferrer"
        >
          YouTube channel
        </a>
        .
      </p>
    </section>
  );
}
