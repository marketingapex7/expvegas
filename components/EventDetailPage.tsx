import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, Clock, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { EventCard } from "@/components/EventCard";
import { buildEventStructuredData } from "@/lib/event-seo";
import { formatPrice } from "@/lib/utils";
import { VegasEvent } from "@/types/event";

function eventSchedule(event: VegasEvent) {
  if (!event.localDate) return null;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(event.localTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(`${event.localDate}T${event.localTime || "12:00:00"}`));
}

export function EventDetailPage({ event, similar, path }: { event: VegasEvent; similar: VegasEvent[]; path: string }) {
  const hasTicketUrl = Boolean(event.affiliateUrl && event.affiliateUrl !== "#");
  const schedule = eventSchedule(event);
  const structuredData = buildEventStructuredData(event, path);
  const taxonomyLabel = event.subcategory && !["undefined", "unknown"].includes(event.subcategory.toLowerCase()) ? event.subcategory : "Vegas entertainment";

  return (
    <section className="px-4 py-10 sm:px-5 sm:py-16">
      {structuredData ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      ) : null}
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-white/65">
          <Link href="/">Home</Link><ChevronRight className="h-4 w-4" /><Link href={`/${event.category === "shows" ? "las-vegas-shows" : `las-vegas-${event.category}`}`}>{event.category === "concerts" ? "Concerts" : event.category === "sports" ? "Sports" : event.category === "comedy" ? "Comedy" : event.category === "attractions" ? "Attractions" : "Shows"}</Link><ChevronRight className="h-4 w-4" /><span className="text-white">{event.name}</span>
        </nav>
        <div className="relative mb-8 aspect-[16/7] min-h-64 overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
          <CardImage src={event.imageUrl} alt={`${event.name} at ${event.venueName}`} category="event" sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">{taxonomyLabel}</p><h1 className="mt-2 text-4xl font-black leading-tight text-white sm:text-6xl">{event.name}</h1></div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.55fr)]">
        <article className="rounded-lg border border-white/10 bg-white/[0.06] p-5 sm:p-8">
          <h2 className="text-2xl font-black text-white">Why this pick works</h2>
          <p className="mt-4 text-lg leading-8 text-white/75 sm:text-xl sm:leading-9">{event.quickVerdict}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-white/80">
              <MapPin className="h-4 w-4 shrink-0 text-amber-100" />
              <span className="min-w-0">{event.venueName} - {event.area}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-white/80">
              <Ticket className="h-4 w-4 shrink-0 text-amber-100" />
              <span>{formatPrice(event.priceMin)}</span>
            </div>
            {schedule ? (
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-white/80 sm:col-span-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-amber-100" />
                <span>{schedule}</span>
              </div>
            ) : null}
            {event.runtimeMinutes ? (
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-white/80">
                <Clock className="h-4 w-4 shrink-0 text-amber-100" />
                <span>{event.runtimeMinutes} minutes</span>
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="font-black text-white">Best for</h2>
              <ul className="mt-3 space-y-2 text-white/70">{event.bestFor.map((item) => <li key={item}>- {item}</li>)}</ul>
            </div>
            <div>
              <h2 className="font-black text-white">Think twice if</h2>
              <ul className="mt-3 space-y-2 text-white/70">{event.skipIf.map((item) => <li key={item}>- {item}</li>)}</ul>
            </div>
          </div>

          {hasTicketUrl ? (
            <a href={event.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 font-black text-black transition hover:bg-amber-100 sm:w-auto">
              Check Tickets <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <Link href="/#trip-builder" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 font-black text-black transition hover:bg-amber-100 sm:w-auto">
              Build Around This Pick <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <p className="mt-3 text-xs leading-5 text-white/45">Prices and availability can change. Confirm the final total and event time before booking.</p>
        </article>

        <aside className="space-y-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-lg font-black text-white">Venue and arrival</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">Allow at least 30 minutes for venue entry, security, and finding your section. Add more time for major arena and Sphere events.</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, Las Vegas, NV`)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-black text-white hover:bg-white/10"><MapPin className="h-4 w-4" /> Open venue map</a>
          </div>
          <div className="rounded-lg border border-amber-200/20 bg-amber-200/[0.08] p-5">
            <h2 className="inline-flex items-center gap-2 text-lg font-black text-white"><ShieldCheck className="h-5 w-5 text-amber-200" /> Know before you go</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/70"><li>Confirm the exact performance time before paying.</li><li>Check age restrictions and venue bag rules.</li><li>Compare the final all-in total, not only the first price shown.</li></ul>
          </div>
        </aside>
        </div>
        {similar.length ? <section className="mt-12 border-t border-white/10 pt-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200">Still comparing?</p><h2 className="mt-2 text-2xl font-black text-white">Similar picks</h2><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{similar.slice(0, 3).map((item) => <EventCard key={item.id} event={item} />)}</div></section> : null}
      </div>
    </section>
  );
}
