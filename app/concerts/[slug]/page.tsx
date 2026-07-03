import { notFound } from "next/navigation";
import { getEventBySlug, seedEvents } from "@/data/seed-events";
import { EventCard } from "@/components/EventCard";
import { rankEvents } from "@/lib/scoring";
import { formatPrice } from "@/lib/utils";

export function generateStaticParams() {
  return seedEvents.filter((event) => event.category === "concerts").map((event) => ({ slug: event.slug }));
}

export default async function ConcertDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event || event.category !== "concerts") notFound();
  const similar = rankEvents(seedEvents.filter((item) => item.id !== event.id)).slice(0, 3);
  return (
    <section className="px-5 py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-200">{event.subcategory}</p>
          <h1 className="mt-3 text-5xl font-black text-white">{event.name}</h1>
          <p className="mt-5 text-xl leading-9 text-white/70">{event.quickVerdict}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-white/10 px-4 py-2">{event.venueName}</span><span className="rounded-full bg-white/10 px-4 py-2">{formatPrice(event.priceMin)}</span></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2"><div><h2 className="font-black text-white">Best for</h2><ul className="mt-3 space-y-2 text-white/70">{event.bestFor.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><h2 className="font-black text-white">Skip if</h2><ul className="mt-3 space-y-2 text-white/70">{event.skipIf.map((item) => <li key={item}>• {item}</li>)}</ul></div></div>
          <a href={event.affiliateUrl} className="mt-8 inline-flex rounded-full bg-fuchsia-300 px-6 py-4 font-black text-black">Check Tickets</a>
        </div>
        <div><h2 className="mb-4 text-2xl font-black text-white">Similar picks</h2><div className="grid gap-5">{similar.map((item) => <EventCard key={item.id} event={item} />)}</div></div>
      </div>
    </section>
  );
}
